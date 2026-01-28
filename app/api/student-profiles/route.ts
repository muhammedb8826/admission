import { NextRequest, NextResponse } from "next/server";
import { getStrapiURL } from "@/lib/strapi/client";
import { getSession } from "@/lib/auth/session";

const extractRelationId = (value: unknown): number | null => {
  if (typeof value === "number") return value;
  if (value && typeof value === "object") {
    const maybeValue = value as { id?: unknown; set?: Array<{ id?: unknown }> };
    if (typeof maybeValue.id === "number") return maybeValue.id;
    if (Array.isArray(maybeValue.set) && typeof maybeValue.set[0]?.id === "number") {
      return maybeValue.set[0].id;
    }
  }
  if (value !== null && value !== undefined) {
    const numValue = Number(value);
    if (!Number.isNaN(numValue) && numValue > 0) return numValue;
  }
  return null;
};

// Map address relation keys to their Strapi collections
const relationCollectionByKey: Record<string, string> = {
  country: "countries",
  region: "regions",
  zone: "zones",
  woreda: "woredas",
};

const extractRelationDocumentId = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const maybeValue = value as { documentId?: unknown };
    if (typeof maybeValue.documentId === "string") return maybeValue.documentId;
  }
  return null;
};

const extractRelationIdentifier = (value: unknown): string | number | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber) && Number.isFinite(asNumber)) return asNumber;
    return trimmed; // documentId string
  }
  if (typeof value === "number") return value;
  if (value && typeof value === "object") {
    const maybe = value as { documentId?: unknown; id?: unknown };
    if (typeof maybe.documentId === "string" && maybe.documentId.trim() !== "") return maybe.documentId;
    if (typeof maybe.id === "number") return maybe.id;
    if (typeof maybe.id === "string") {
      const trimmed = maybe.id.trim();
      const asNumber = Number(trimmed);
      if (!Number.isNaN(asNumber) && Number.isFinite(asNumber)) return asNumber;
      if (trimmed !== "") return trimmed;
    }
  }
  return null;
};


const resolveComponentRelationIdentifier = async (
  value: unknown,
  key: string,
  strapiUrl: string,
  authToken?: string
): Promise<string | number | null> => {
  // Already a documentId string on the value itself
  const directDocId = extractRelationDocumentId(value);
  if (directDocId) return directDocId;

  // Try to get numeric id from various shapes
  const numericId = extractRelationId(value);
  if (!numericId) return null;

  const collection = relationCollectionByKey[key];
  if (!collection) {
    // Unknown key, just return the numeric id
    return numericId;
  }

  // Attempt to resolve documentId from Strapi by numeric id
  try {
    const url = `${strapiUrl}/api/${collection}/${numericId}?fields[0]=documentId`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
    });

    if (response.ok) {
      const result = await response.json().catch(() => ({}));
      const resolvedDocId = result?.data?.documentId;
      if (typeof resolvedDocId === "string") {
        return resolvedDocId;
      }
    }
  } catch {
    // Swallow lookup errors and fall back to numeric id
  }

  return numericId;
};

const normalizeAddressComponent = async (
  address: Record<string, unknown>,
  strapiUrl: string,
  authToken?: string
): Promise<Record<string, unknown>> => {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(address)) {
    if (key === "id") continue;

    if (key in relationCollectionByKey) {
      const target = await resolveComponentRelationIdentifier(
        value,
        key,
        strapiUrl,
        authToken
      );

      if (target != null) {
        // For relations inside components, Strapi expects the ID / documentId directly
        cleaned[key] = target;
      } else if (value === null) {
        cleaned[key] = null;
      }
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
};

const getUserIdentifiers = (session: unknown) => {
  const s = session as { userId?: unknown; userDocumentId?: unknown };
  const userIdRaw = typeof s?.userId === "string" ? s.userId : String(s?.userId ?? "");
  const userIdNumber = Number(userIdRaw);
  const userDocumentId =
    typeof s?.userDocumentId === "string" && s.userDocumentId.trim() !== ""
      ? s.userDocumentId.trim()
      : null;

  return {
    userIdRaw,
    userIdNumber: Number.isFinite(userIdNumber) ? userIdNumber : null,
    userDocumentId,
  };
};

const parseStrapiCollectionResult = (raw: unknown) => {
  const obj = raw as { data?: unknown; meta?: unknown };
  const data = obj?.data;
  const arr = Array.isArray(data)
    ? (data as Record<string, unknown>[])
    : data
      ? ([data] as Record<string, unknown>[])
      : [];
  return { items: arr, meta: obj?.meta };
};

const fetchStudentProfileForUser = async ({
  strapiUrl,
  populateQuery,
  userJwt,
  apiToken,
  userIdNumber,
  userDocumentId,
}: {
  strapiUrl: string;
  populateQuery: string;
  userJwt?: string;
  apiToken?: string;
  userIdNumber: number | null;
  userDocumentId: string | null;
}): Promise<{ profile: Record<string, unknown> | null; raw: Record<string, unknown> }> => {
  const safeUserPopulate = "populate[user][fields][0]=id&populate[user][fields][1]=documentId";
  // If duplicates exist for a user (historical bug), always pick the newest one deterministically.
  const baseQueryParts = [
    populateQuery,
    safeUserPopulate,
    "sort[0]=updatedAt:desc",
    "sort[1]=createdAt:desc",
    "pagination[pageSize]=1",
  ].filter(Boolean);
  const baseQuery = baseQueryParts.join("&");

  const candidates: string[] = [];
  if (userDocumentId) {
    candidates.push(`${strapiUrl}/api/student-profiles?filters[user][documentId][$eq]=${encodeURIComponent(userDocumentId)}&${baseQuery}`);
  }
  if (typeof userIdNumber === "number" && userIdNumber > 0) {
    candidates.push(`${strapiUrl}/api/student-profiles?filters[user][id][$eq]=${userIdNumber}&${baseQuery}`);
  }

  const tryFetch = async (url: string, token?: string) => {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      cache: "no-store",
    });
    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: response.ok, status: response.status, raw };
  };

  const isInvalidKeyUser = (raw: Record<string, unknown>, status: number) => {
    if (status !== 400) return false;
    const message =
      (raw as { error?: { message?: unknown } })?.error?.message ??
      (raw as { message?: unknown })?.message;
    return typeof message === "string" && message.includes("Invalid key user");
  };

  // 1) Try relation filters first (prefer user documentId)
  for (const url of candidates) {
    for (const token of [apiToken, userJwt]) {
      const res = await tryFetch(url, token);
      if (res.ok) {
        const { items } = parseStrapiCollectionResult(res.raw);
        return { profile: items[0] || null, raw: res.raw };
      }

      if (isInvalidKeyUser(res.raw, res.status)) {
        // Try next strategy / next url
        continue;
      }

      // Other errors: return immediately
      return { profile: null, raw: res.raw };
    }
  }

  // 2) Fallback: unfiltered fetch (then match by populated user)
  const fallbackUrl = `${strapiUrl}/api/student-profiles?${baseQuery}`;
  for (const token of [apiToken, userJwt]) {
    const res = await tryFetch(fallbackUrl, token);
    if (!res.ok) continue;

    const { items } = parseStrapiCollectionResult(res.raw);
    const matched = items.find((p) => {
      const u = (p.user as { id?: unknown; documentId?: unknown } | undefined) ?? undefined;
      if (userDocumentId && typeof u?.documentId === "string" && u.documentId === userDocumentId) return true;
      if (typeof userIdNumber === "number" && typeof u?.id === "number" && u.id === userIdNumber) return true;
      return false;
    });

    return { profile: matched || null, raw: res.raw };
  }

  return { profile: null, raw: {} };
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || !body.data) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const strapiUrl = getStrapiURL();
    if (!strapiUrl) {
      return NextResponse.json(
        { error: "Strapi API is not configured" },
        { status: 500 }
      );
    }


    const userJwt = session.jwt;
    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
    const authToken = userJwt || apiToken;

    const { userIdNumber, userDocumentId } = getUserIdentifiers(session);

    // Since Strapi creates a student profile on signup, prefer updating the existing profile.
    const existing = await fetchStudentProfileForUser({
      strapiUrl,
      populateQuery: "",
      userJwt,
      apiToken,
      userIdNumber,
      userDocumentId,
    });

    const existingProfile = existing.profile;
    const existingProfileId = (existingProfile as { id?: number })?.id ?? null;
    const existingProfileDocumentId =
      (existingProfile as { documentId?: string })?.documentId ?? null;

    // Associate the profile with the logged-in user
    // Remove email field if present (not in Strapi schema)
    const profileData = Object.fromEntries(
      Object.entries(body.data).filter(
        ([key]) =>
          key !== "email" &&
          key !== "id" &&
          key !== "documentId" &&
          key !== "userId" &&
          key !== "user"
      )
    );

    // Addresses are components; normalize relation fields to documentId connect payloads

    // Helper function to clean education relations (country/region/zone/woreda as id OR documentId)
    const cleanEducationRelations = (obj: Record<string, unknown> | null | undefined): Record<string, unknown> | null | undefined => {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;

      const cleaned: Record<string, unknown> = {};
      const relationKeys = ["country", "region", "zone", "woreda"];

      for (const [key, value] of Object.entries(obj)) {
        if (relationKeys.includes(key)) {
          const relationIdentifier = extractRelationIdentifier(value);
          if (relationIdentifier != null) {
            cleaned[key] = relationIdentifier;
          } else if (value === null) {
            cleaned[key] = null;
          }
        } else {
          cleaned[key] = value;
        }
      }

      return cleaned;
    };

    // Education fields are RELATIONS, not components
    // We need to create the education records first, then link them
    let primaryEducationId: number | null = null;
    let primaryEducationDocumentId: string | null = null;
    let secondaryEducationId: number | null = null;
    let secondaryEducationDocumentId: string | null = null;
    const tertiaryEducationIdentifiers: Array<string | number> = [];
    
    // Handle primary_education relation
    if (profileData.primary_education && typeof profileData.primary_education === 'object') {
      const primaryData = profileData.primary_education as Record<string, unknown>;
      const existingId = primaryData.id as number | undefined;
      
      // Clean the education data (remove id, clean location relations)
      const cleanedPrimary = cleanEducationRelations(primaryData);
      if (cleanedPrimary && typeof cleanedPrimary === 'object') {
        delete (cleanedPrimary as Record<string, unknown>).id;
      }
      
      // Create or update primary education
      if (existingId) {
        // Update existing
        const updateResponse = await fetch(`${strapiUrl}/api/primary-educations/${existingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          body: JSON.stringify({ data: cleanedPrimary }),
        });
        
        if (updateResponse.ok) {
          const updateResult = await updateResponse.json().catch(() => ({}));
          primaryEducationId = updateResult?.data?.id || existingId;
          primaryEducationDocumentId = updateResult?.data?.documentId || null;
        }
      } else {
        // Create new
      const createResponse = await fetch(`${strapiUrl}/api/primary-educations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify({ data: cleanedPrimary }),
      });
      
      if (createResponse.ok) {
        const createResult = await createResponse.json().catch(() => ({}));
        primaryEducationId = createResult?.data?.id;
        primaryEducationDocumentId = createResult?.data?.documentId || null;
        }
      }
      
      // Link relation (Strapi v5: direct assignment for oneToOne is reliable)
      if (primaryEducationDocumentId || primaryEducationId) {
        profileData.primary_education = primaryEducationDocumentId || primaryEducationId;
      } else {
        delete profileData.primary_education;
      }
    }
    
    // Handle secondary_education relation
    if (profileData.secondary_education && typeof profileData.secondary_education === 'object') {
      const secondaryData = profileData.secondary_education as Record<string, unknown>;
      const existingId = secondaryData.id as number | undefined;
      
      // Clean the education data
      const cleanedSecondary = cleanEducationRelations(secondaryData);
      if (cleanedSecondary && typeof cleanedSecondary === 'object') {
        delete (cleanedSecondary as Record<string, unknown>).id;
      }
      
      // Create or update secondary education
      if (existingId) {
        const updateResponse = await fetch(`${strapiUrl}/api/secondary-educations/${existingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          body: JSON.stringify({ data: cleanedSecondary }),
        });
        
        if (updateResponse.ok) {
          const updateResult = await updateResponse.json().catch(() => ({}));
          secondaryEducationId = updateResult?.data?.id || existingId;
          secondaryEducationDocumentId = updateResult?.data?.documentId || null;
        }
      } else {
      const createResponse = await fetch(`${strapiUrl}/api/secondary-educations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify({ data: cleanedSecondary }),
      });
      
      if (createResponse.ok) {
        const createResult = await createResponse.json().catch(() => ({}));
        secondaryEducationId = createResult?.data?.id;
        secondaryEducationDocumentId = createResult?.data?.documentId || null;
        }
      }
      
      // Link relation (Strapi v5: direct assignment for oneToOne is reliable)
      if (secondaryEducationDocumentId || secondaryEducationId) {
        profileData.secondary_education = secondaryEducationDocumentId || secondaryEducationId;
      } else {
        delete profileData.secondary_education;
      }
    }
    
    // Handle tertiary_educations relation (oneToMany)
    if (profileData.tertiary_educations && Array.isArray(profileData.tertiary_educations)) {
      for (const tertiaryData of profileData.tertiary_educations) {
        if (tertiaryData && typeof tertiaryData === 'object') {
          const tertiary = tertiaryData as Record<string, unknown>;
          const existingId = tertiary.id as number | undefined;
          
          // Clean the education data
          const cleanedTertiary = cleanEducationRelations(tertiary);
          if (cleanedTertiary && typeof cleanedTertiary === 'object') {
            delete (cleanedTertiary as Record<string, unknown>).id;
          }
          
          // Create or update tertiary education
          if (existingId) {
            const updateResponse = await fetch(`${strapiUrl}/api/tertiar-educations/${existingId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(authToken && { Authorization: `Bearer ${authToken}` }),
              },
              body: JSON.stringify({ data: cleanedTertiary }),
            });
            
            const updateResult = await updateResponse.json().catch(() => ({}));
            
            if (updateResponse.ok) {
              const tertiaryId = updateResult?.data?.documentId || updateResult?.data?.id || existingId;
              if (tertiaryId) {
                tertiaryEducationIdentifiers.push(tertiaryId);
                console.log("Tertiary education updated:", tertiaryId);
              }
            } else {
              console.error("Failed to update tertiary education:", {
                status: updateResponse.status,
                error: updateResult,
                existingId,
              });
            }
          } else {
          // Use the correct endpoint name: tertiar-educations (note the spelling)
          const createResponse = await fetch(`${strapiUrl}/api/tertiar-educations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(authToken && { Authorization: `Bearer ${authToken}` }),
            },
            body: JSON.stringify({ data: cleanedTertiary }),
          });
          
          const createResult = await createResponse.json().catch(() => ({}));
          
          if (createResponse.ok) {
            const tertiaryId = createResult?.data?.documentId || createResult?.data?.id;
            if (tertiaryId) {
              tertiaryEducationIdentifiers.push(tertiaryId);
              console.log("Tertiary education created:", tertiaryId);
            } else {
              console.error("Tertiary education created but no ID returned:", createResult);
            }
          } else {
              console.error("Failed to create tertiary education:", {
              status: createResponse.status,
              error: createResult,
              url: `${strapiUrl}/api/tertiar-educations`,
            });
            }
          }
        }
      }
      
      // Replace with relation format (oneToMany uses set)
      if (tertiaryEducationIdentifiers.length > 0) {
        profileData.tertiary_educations = { set: tertiaryEducationIdentifiers };
        console.log("Setting tertiary_educations relation:", profileData.tertiary_educations);
      } else {
        console.warn("No tertiary education IDs collected, removing from profile data");
        delete profileData.tertiary_educations;
      }
    }

    // Handle professional_experiences relation (oneToMany)
    const professionalExperienceIdentifiers: Array<string | number> = [];
    if (profileData.professional_experiences && Array.isArray(profileData.professional_experiences)) {
      console.log("Processing professional_experiences (POST):", {
        count: profileData.professional_experiences.length,
      });

      for (const professionalData of profileData.professional_experiences) {
        if (professionalData && typeof professionalData === "object") {
          const professional = professionalData as Record<string, unknown>;
          const existingId = professional.id as number | undefined;

          const cleanedProfessional = { ...professional };
          delete cleanedProfessional.id;

          if (existingId) {
            const updateResponse = await fetch(`${strapiUrl}/api/professional-experiences/${existingId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(authToken && { Authorization: `Bearer ${authToken}` }),
              },
              body: JSON.stringify({ data: cleanedProfessional }),
            });

            const updateResult = await updateResponse.json().catch(() => ({}));
            if (updateResponse.ok) {
              const professionalId =
                updateResult?.data?.documentId || updateResult?.data?.id || existingId;
              if (professionalId) {
                professionalExperienceIdentifiers.push(professionalId);
              }
            }
          } else {
            const createResponse = await fetch(`${strapiUrl}/api/professional-experiences`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(authToken && { Authorization: `Bearer ${authToken}` }),
              },
              body: JSON.stringify({ data: cleanedProfessional }),
            });

            const createResult = await createResponse.json().catch(() => ({}));
            if (createResponse.ok) {
              const professionalId = createResult?.data?.documentId || createResult?.data?.id;
              if (professionalId) {
                professionalExperienceIdentifiers.push(professionalId);
              }
            }
          }
        }
      }

      if (professionalExperienceIdentifiers.length > 0) {
        profileData.professional_experiences = { set: professionalExperienceIdentifiers };
      } else {
        delete profileData.professional_experiences;
      }
    }

    // Handle research_engagements relation (oneToMany)
    const researchEngagementIdentifiers: Array<string | number> = [];
    if (profileData.research_engagements && Array.isArray(profileData.research_engagements)) {
      console.log("Processing research_engagements (POST):", {
        count: profileData.research_engagements.length,
      });

      for (const researchData of profileData.research_engagements) {
        if (researchData && typeof researchData === "object") {
          const research = researchData as Record<string, unknown>;
          const existingId = research.id as number | undefined;

          const cleanedResearch = { ...research };
          delete cleanedResearch.id;

          if (existingId) {
            const updateResponse = await fetch(`${strapiUrl}/api/research-engagements/${existingId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(authToken && { Authorization: `Bearer ${authToken}` }),
              },
              body: JSON.stringify({ data: cleanedResearch }),
            });

            const updateResult = await updateResponse.json().catch(() => ({}));
            if (updateResponse.ok) {
              const researchId =
                updateResult?.data?.documentId || updateResult?.data?.id || existingId;
              if (researchId) {
                researchEngagementIdentifiers.push(researchId);
              }
            }
          } else {
            const createResponse = await fetch(`${strapiUrl}/api/research-engagements`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(authToken && { Authorization: `Bearer ${authToken}` }),
              },
              body: JSON.stringify({ data: cleanedResearch }),
            });

            const createResult = await createResponse.json().catch(() => ({}));
            if (createResponse.ok) {
              const researchId = createResult?.data?.documentId || createResult?.data?.id;
              if (researchId) {
                researchEngagementIdentifiers.push(researchId);
              }
            }
          }
        }
      }

      if (researchEngagementIdentifiers.length > 0) {
        profileData.research_engagements = { set: researchEngagementIdentifiers };
      } else {
        delete profileData.research_engagements;
      }
    }

    // Normalize address components (relations use documentId connect)
    if (profileData.residentialAddress && typeof profileData.residentialAddress === "object") {
      profileData.residentialAddress = await normalizeAddressComponent(
        profileData.residentialAddress as Record<string, unknown>,
        strapiUrl,
        authToken
      ) as typeof profileData.residentialAddress;
    }
    if (profileData.birthAddress && typeof profileData.birthAddress === "object") {
      profileData.birthAddress = await normalizeAddressComponent(
        profileData.birthAddress as Record<string, unknown>,
        strapiUrl,
        authToken
      ) as typeof profileData.birthAddress;
    }
    if (profileData.personToBeContacted && typeof profileData.personToBeContacted === "object") {
      profileData.personToBeContacted = await normalizeAddressComponent(
        profileData.personToBeContacted as Record<string, unknown>,
        strapiUrl,
        authToken
      ) as typeof profileData.personToBeContacted;
    }

    // If an existing profile was found, UPDATE it instead of creating a new one
    // This prevents duplicate profiles since Strapi creates a profile on signup
    // Use documentId if available, otherwise fall back to numeric ID
    if (existingProfileId || existingProfileDocumentId) {
      const profileIdentifier = existingProfileDocumentId || existingProfileId;
      console.log("Updating existing profile (POST -> PUT):", {
        profileId: existingProfileId,
        documentId: existingProfileDocumentId,
        usingIdentifier: profileIdentifier,
      });

      const updateUrl = `${strapiUrl}/api/student-profiles/${profileIdentifier}`;
      
      const response = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(userJwt && { Authorization: `Bearer ${userJwt}` }),
          ...(!userJwt && apiToken && { Authorization: `Bearer ${apiToken}` }),
        },
        body: JSON.stringify({
          data: profileData,
        }),
      });

      let result = await response.json().catch(() => ({}));
      
      // If we got 403 with user JWT, try with API token
      if (!response.ok && response.status === 403 && userJwt && apiToken) {
        console.log("Got 403 with user JWT, retrying with API token...");
        const retryResponse = await fetch(updateUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
          },
          body: JSON.stringify({
            data: profileData,
          }),
        });
        result = await retryResponse.json().catch(() => ({}));
        
        if (retryResponse.ok) {
          return NextResponse.json(result, { status: 200 });
        }
      }

      if (!response.ok) {
        const errorMessage =
          result?.error?.message ||
          result?.message ||
          "Failed to update student profile";
        
        console.error("Strapi API error (update):", {
          status: response.status,
          error: result,
          url: updateUrl,
        });
        
        return NextResponse.json(
          { error: errorMessage, details: result },
          { status: response.status || 500 }
        );
      }

      // Return the result with proper structure
      return NextResponse.json(result, { status: 200 });
    } else {
      // No existing profile found - create new one (edge case, shouldn't happen if Strapi auto-creates)
      console.log("Creating new profile (no existing profile found)");

      // Set the user relation on create (prefer user documentId)
      if (userDocumentId || (typeof userIdNumber === "number" && userIdNumber > 0)) {
        (profileData as Record<string, unknown>).user =
          userDocumentId || userIdNumber;
      }

    const response = await fetch(`${strapiUrl}/api/student-profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: JSON.stringify({
        data: profileData,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        result?.error?.message ||
        result?.message ||
        "Failed to create student profile";
      
        console.error("Strapi API error (create):", {
        status: response.status,
        error: result,
        url: `${strapiUrl}/api/student-profiles`,
      });
      
      return NextResponse.json(
        { error: errorMessage, details: result },
        { status: response.status || 500 }
      );
    }

    // Return the result with proper structure
    return NextResponse.json(result, { status: 201 });
    }
  } catch (error) {
    console.error("Student profile creation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create student profile";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const strapiUrl = getStrapiURL();
    if (!strapiUrl) {
      return NextResponse.json(
        { error: "Strapi API is not configured" },
        { status: 500 }
      );
    }

    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
    const userJwt = session.jwt;
    const requestUrl = new URL(request.url);
    
    // Extract the original query string and preserve all populate parameters
    // Decode URL-encoded parameters first
    const originalQuery = requestUrl.search;
    const decodedQuery = decodeURIComponent(originalQuery);
    
    // Extract populate parameters from the decoded query string
    // Handle both simple (populate=*) and nested (populate[residentialAddress][populate]=*) formats
    const populateParams: string[] = [];
    const queryString = decodedQuery.startsWith('?') ? decodedQuery.substring(1) : decodedQuery;
    const params = queryString.split('&');
    
    for (const param of params) {
      if (param.startsWith('populate')) {
        // Parameters are already decoded from decodeURIComponent(originalQuery)
        populateParams.push(param);
      }
    }
    
    // Build the query string
    const queryStringParts: string[] = [];
    
    // Add populate parameters (don't populate user to avoid role field issues)
    if (populateParams.length > 0) {
      queryStringParts.push(...populateParams);
    } else {
      queryStringParts.push('populate=*');
    }
    
    const populateQuery = queryStringParts.join('&');
    const { userIdNumber, userDocumentId } = getUserIdentifiers(session);
    const fetchResult = await fetchStudentProfileForUser({
      strapiUrl,
      populateQuery,
      userJwt,
      apiToken,
      userIdNumber,
      userDocumentId,
    });
    const url = `${strapiUrl}/api/student-profiles?${populateQuery}`;
    
    console.log("Fetching profile:", { 
      originalQuery,
      decodedQuery,
      populateParams,
      queryStringParts,
      url,
    });

    const filteredData = fetchResult.profile;
    
    console.log("Final filtered data:", { 
      hasData: !!filteredData, 
      profileId: filteredData?.id,
      hasResidentialAddress: !!filteredData?.residentialAddress 
    });

    // Return only the user's profile or null
    return NextResponse.json(
      { 
        data: filteredData, 
        meta: (fetchResult.raw as { meta?: unknown })?.meta || { pagination: { total: filteredData ? 1 : 0 } } 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Student profile fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch student profiles";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || !body.data) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const strapiUrl = getStrapiURL();
    if (!strapiUrl) {
      return NextResponse.json(
        { error: "Strapi API is not configured" },
        { status: 500 }
      );
    }

    const userJwt = session.jwt;
    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
    const authToken = userJwt || apiToken;
    const { userIdNumber, userDocumentId } = getUserIdentifiers(session);

    // IMPORTANT: we must fetch currently-linked relations too, otherwise repeated saves
    // will recreate or fail to update related entries (because the client often doesn't send IDs/documentIds)
    const existing = await fetchStudentProfileForUser({
      strapiUrl,
      populateQuery: [
        // one-to-one educations
        "populate[primary_education][populate]=*",
        "populate[secondary_education][populate]=*",
        // one-to-many collections
        "populate[tertiary_educations][populate]=*",
        "populate[professional_experiences][populate]=*",
        "populate[research_engagements][populate]=*",
      ].join("&"),
      userJwt,
      apiToken,
      userIdNumber,
      userDocumentId,
    });

    const userProfile = existing.profile;
    if (!userProfile) {
      return NextResponse.json(
        { error: "Student profile not found. Please refresh and try again." },
        { status: 404 }
      );
    }

    // Use documentId from the fetched profile (preferred) or fall back to numeric id
    // This ensures we use the correct identifier that Strapi expects
    const actualDocumentId = (userProfile as { documentId?: string })?.documentId;
    const actualProfileId = userProfile?.id;
    const finalIdentifier = actualDocumentId || actualProfileId;

    // Existing linked relations (used to prevent duplicates / lost updates on repeated saves)
    const existingPrimary = (userProfile as { primary_education?: unknown })?.primary_education as
      | { id?: unknown; documentId?: unknown }
      | undefined;
    const existingSecondary = (userProfile as { secondary_education?: unknown })?.secondary_education as
      | { id?: unknown; documentId?: unknown }
      | undefined;
    const existingTertiary = Array.isArray((userProfile as { tertiary_educations?: unknown })?.tertiary_educations)
      ? (((userProfile as { tertiary_educations?: unknown }).tertiary_educations as unknown[]) ?? [])
      : [];
    const existingProfessional = Array.isArray((userProfile as { professional_experiences?: unknown })?.professional_experiences)
      ? (((userProfile as { professional_experiences?: unknown }).professional_experiences as unknown[]) ?? [])
      : [];
    const existingResearch = Array.isArray((userProfile as { research_engagements?: unknown })?.research_engagements)
      ? (((userProfile as { research_engagements?: unknown }).research_engagements as unknown[]) ?? [])
      : [];

    console.log("Profile verification successful:", {
      actualId: actualProfileId,
      actualDocumentId,
      usingIdentifier: finalIdentifier,
    });


    const updateData = Object.fromEntries(
      Object.entries(body.data).filter(
        ([key]) =>
          key !== "email" &&
          key !== "id" &&
          key !== "documentId" &&
          key !== "userId" &&
          key !== "user"
      )
    );
    
    // Ensure boolean fields are preserved (including false values)
    // Special need fields should always be included if present in the request
    if ('specialNeed' in body.data) {
      updateData.specialNeed = body.data.specialNeed;
    }
    if ('specialNeedDescription' in body.data) {
      updateData.specialNeedDescription = body.data.specialNeedDescription;
    }

    // Helper to clean component relations (addresses) to Strapi connect syntax
    const cleanComponentRelations = (obj: Record<string, unknown> | null | undefined): Record<string, unknown> | null | undefined => {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;

      const cleaned: Record<string, unknown> = {};
      const relationKeys = ["country", "region", "zone", "woreda"];

      // Keep component ID so Strapi updates the existing component instance
      if ("id" in obj && typeof (obj as { id?: unknown }).id === "number") {
        cleaned.id = (obj as { id: number }).id;
      }

      for (const [key, value] of Object.entries(obj)) {
        if (key === "id") continue;

        if (relationKeys.includes(key)) {
          // Prefer documentId when present, otherwise fall back to numeric id or raw value
          const target: unknown = value;
          let targetId: string | number | null = null;

          if (target && typeof target === "object") {
            const v = target as { documentId?: unknown; id?: unknown };
            if (typeof v.documentId === "string") {
              targetId = v.documentId;
            } else if (typeof v.id === "number" || typeof v.id === "string") {
              targetId = v.id as number | string;
            }
          } else if (typeof target === "string" || typeof target === "number") {
            targetId = target as string | number;
          }

          if (targetId != null) {
            // Strapi v5 connect syntax for relations in components
            cleaned[key] = { connect: [targetId] };
          } else {
            cleaned[key] = null;
          }
        } else if (value && typeof value === "object" && !Array.isArray(value)) {
          cleaned[key] = cleanComponentRelations(value as Record<string, unknown>);
        } else {
          cleaned[key] = value;
        }
      }

      return cleaned;
    };

    const resolveDocumentIdByNumericId = async (
      collection: string,
      numericId: number
    ): Promise<string | null> => {
      // Strapi v5 endpoints use documentId; numeric id updates often 404.
      // Try resolving documentId via filtered collection query.
      try {
        const url = `${strapiUrl}/api/${collection}?filters[id][$eq]=${numericId}&fields[0]=documentId&pagination[pageSize]=1`;
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          cache: "no-store",
        });
        if (!res.ok) return null;
        const json = await res.json().catch(() => ({}));
        const docId = (json as { data?: Array<{ documentId?: unknown }> })?.data?.[0]?.documentId;
        return typeof docId === "string" && docId.trim() !== "" ? docId : null;
      } catch {
        return null;
      }
    };


    if (updateData.residentialAddress && typeof updateData.residentialAddress === "object") {
      const cleaned = await normalizeAddressComponent(
        updateData.residentialAddress as Record<string, unknown>,
        strapiUrl,
        authToken
      );
      console.log("Residential address cleaned:", {
        hasCountry: "country" in cleaned,
        countryType: typeof cleaned.country,
        countryValue: cleaned.country,
        hasRegion: "region" in cleaned,
        regionType: typeof cleaned.region,
        regionValue: cleaned.region,
        hasZone: "zone" in cleaned,
        zoneType: typeof cleaned.zone,
        zoneValue: cleaned.zone,
        hasWoreda: "woreda" in cleaned,
        woredaType: typeof cleaned.woreda,
        woredaValue: cleaned.woreda,
        allKeys: Object.keys(cleaned),
      });
      updateData.residentialAddress = cleaned as typeof updateData.residentialAddress;
    }
    if (updateData.birthAddress && typeof updateData.birthAddress === "object") {
      updateData.birthAddress = await normalizeAddressComponent(
        updateData.birthAddress as Record<string, unknown>,
        strapiUrl,
        authToken
      ) as typeof updateData.birthAddress;
    }
    if (updateData.personToBeContacted && typeof updateData.personToBeContacted === "object") {
      updateData.personToBeContacted = await normalizeAddressComponent(
        updateData.personToBeContacted as Record<string, unknown>,
        strapiUrl,
        authToken
      ) as typeof updateData.personToBeContacted;
    }
    
    // Education fields are RELATIONS, not components
    // We need to create/update the education records first, then link them
    let primaryEducationId: number | null = null;
    let primaryEducationDocumentId: string | null = null;
    let secondaryEducationId: number | null = null;
    let secondaryEducationDocumentId: string | null = null;
    const tertiaryEducationIdentifiers: Array<string | number> = [];
    
    // Handle primary_education relation
    if (updateData.primary_education && typeof updateData.primary_education === 'object') {
      const primaryData = updateData.primary_education as Record<string, unknown>;

      // Strapi v5 expects documentId for single-type URLs. Numeric ids here commonly 404.
      // Prefer: payload.documentId -> existingLinked.documentId -> payload.id -> existingLinked.id
      const payloadDocId =
        typeof (primaryData as { documentId?: unknown })?.documentId === "string"
          ? ((primaryData as { documentId: string }).documentId as string)
          : null;
      const existingDocId =
        typeof existingPrimary?.documentId === "string" ? (existingPrimary.documentId as string) : null;
      const payloadId = extractRelationIdentifier(primaryData.id);
      const existingId = extractRelationIdentifier(existingPrimary?.id);
      const existingIdentifier = payloadDocId ?? existingDocId ?? payloadId ?? existingId;
      
      // Clean the education data (remove id, clean location relations)
      const cleanedPrimary = cleanComponentRelations(primaryData);
      if (cleanedPrimary && typeof cleanedPrimary === 'object') {
        delete (cleanedPrimary as Record<string, unknown>).id;
        delete (cleanedPrimary as Record<string, unknown>).documentId;
      }
      
      // Create or update primary education
      if (existingIdentifier) {
        // Update existing (Strapi v5: prefer documentId in URL; numeric id may work but is less reliable)
        const updateUrl = `${strapiUrl}/api/primary-educations/${existingIdentifier}`;
        const updatePayload = cleanedPrimary && typeof cleanedPrimary === "object"
          ? { ...(cleanedPrimary as Record<string, unknown>) }
          : cleanedPrimary;
        if (updatePayload && typeof updatePayload === "object") {
          delete (updatePayload as Record<string, unknown>).id;
          delete (updatePayload as Record<string, unknown>).documentId;
        }
        const updateResponse = await fetch(updateUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          body: JSON.stringify({ data: updatePayload }),
        });
        
        const updateResult = await updateResponse.json().catch(() => ({}));
        if (updateResponse.ok) {
          primaryEducationId = updateResult?.data?.id || (typeof existingIdentifier === "number" ? existingIdentifier : null);
          primaryEducationDocumentId = updateResult?.data?.documentId || (typeof existingIdentifier === "string" ? existingIdentifier : null);
        } else {
          // If we tried numeric id (or got a stale numeric id) and Strapi v5 404s, resolve documentId and retry once.
          if (updateResponse.status === 404 && typeof existingIdentifier === "number") {
            const resolvedDocId = await resolveDocumentIdByNumericId("primary-educations", existingIdentifier);
            if (resolvedDocId) {
              const retryUrl = `${strapiUrl}/api/primary-educations/${resolvedDocId}`;
              const retryPayload = updatePayload;
              const retryRes = await fetch(retryUrl, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  ...(authToken && { Authorization: `Bearer ${authToken}` }),
                },
                body: JSON.stringify({ data: retryPayload }),
              });
              const retryJson = await retryRes.json().catch(() => ({}));
              if (retryRes.ok) {
                primaryEducationId = retryJson?.data?.id || null;
                primaryEducationDocumentId = retryJson?.data?.documentId || resolvedDocId;
              } else {
                console.error("Failed to update primary education (retry with resolved documentId):", {
                  status: retryRes.status,
                  retryUrl,
                  error: retryJson,
                  resolvedDocId,
                });
              }
            }
          }
          console.error("Failed to update primary education:", {
            status: updateResponse.status,
            updateUrl,
            error: updateResult,
            existingIdentifier,
            cleanedPrimary,
          });
        }
      } else {
        // Create new
        const createPayload = cleanedPrimary && typeof cleanedPrimary === "object"
          ? { ...(cleanedPrimary as Record<string, unknown>) }
          : cleanedPrimary;
        if (createPayload && typeof createPayload === "object") {
          delete (createPayload as Record<string, unknown>).id;
          delete (createPayload as Record<string, unknown>).documentId;
        }
        const createResponse = await fetch(`${strapiUrl}/api/primary-educations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          body: JSON.stringify({ data: createPayload }),
        });
        
        if (createResponse.ok) {
          const createResult = await createResponse.json().catch(() => ({}));
          primaryEducationId = createResult?.data?.id;
          primaryEducationDocumentId = createResult?.data?.documentId || null;
        } else {
          const createResult = await createResponse.json().catch(() => ({}));
          console.error("Failed to create primary education:", {
            status: createResponse.status,
            error: createResult,
            cleanedPrimary,
          });
        }
      }
      
      // Link relation (Strapi v5: direct assignment for oneToOne is reliable)
      if (primaryEducationDocumentId || primaryEducationId) {
        updateData.primary_education = primaryEducationDocumentId || primaryEducationId;
      } else {
        delete updateData.primary_education;
      }
    }
    
    // Handle secondary_education relation
    if (updateData.secondary_education && typeof updateData.secondary_education === 'object') {
      const secondaryData = updateData.secondary_education as Record<string, unknown>;

      const payloadDocId =
        typeof (secondaryData as { documentId?: unknown })?.documentId === "string"
          ? ((secondaryData as { documentId: string }).documentId as string)
          : null;
      const existingDocId =
        typeof existingSecondary?.documentId === "string"
          ? (existingSecondary.documentId as string)
          : null;
      const payloadId = extractRelationIdentifier(secondaryData.id);
      const existingId = extractRelationIdentifier(existingSecondary?.id);
      const existingIdentifier = payloadDocId ?? existingDocId ?? payloadId ?? existingId;
      
      // Clean the education data
      const cleanedSecondary = cleanComponentRelations(secondaryData);
      if (cleanedSecondary && typeof cleanedSecondary === 'object') {
        delete (cleanedSecondary as Record<string, unknown>).id;
        delete (cleanedSecondary as Record<string, unknown>).documentId;
      }
      
      // Create or update secondary education
      if (existingIdentifier) {
        const updateUrl = `${strapiUrl}/api/secondary-educations/${existingIdentifier}`;
        const updatePayload = cleanedSecondary && typeof cleanedSecondary === "object"
          ? { ...(cleanedSecondary as Record<string, unknown>) }
          : cleanedSecondary;
        if (updatePayload && typeof updatePayload === "object") {
          delete (updatePayload as Record<string, unknown>).id;
          delete (updatePayload as Record<string, unknown>).documentId;
        }
        const updateResponse = await fetch(updateUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          body: JSON.stringify({ data: updatePayload }),
        });
        
        const updateResult = await updateResponse.json().catch(() => ({}));
        if (updateResponse.ok) {
          secondaryEducationId = updateResult?.data?.id || (typeof existingIdentifier === "number" ? existingIdentifier : null);
          secondaryEducationDocumentId = updateResult?.data?.documentId || (typeof existingIdentifier === "string" ? existingIdentifier : null);
        } else {
          if (updateResponse.status === 404 && typeof existingIdentifier === "number") {
            const resolvedDocId = await resolveDocumentIdByNumericId("secondary-educations", existingIdentifier);
            if (resolvedDocId) {
              const retryUrl = `${strapiUrl}/api/secondary-educations/${resolvedDocId}`;
              const retryPayload = updatePayload;
              const retryRes = await fetch(retryUrl, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  ...(authToken && { Authorization: `Bearer ${authToken}` }),
                },
                body: JSON.stringify({ data: retryPayload }),
              });
              const retryJson = await retryRes.json().catch(() => ({}));
              if (retryRes.ok) {
                secondaryEducationId = retryJson?.data?.id || null;
                secondaryEducationDocumentId = retryJson?.data?.documentId || resolvedDocId;
              } else {
                console.error("Failed to update secondary education (retry with resolved documentId):", {
                  status: retryRes.status,
                  retryUrl,
                  error: retryJson,
                  resolvedDocId,
                });
              }
            }
          }
          console.error("Failed to update secondary education:", {
            status: updateResponse.status,
            updateUrl,
            error: updateResult,
            existingIdentifier,
            cleanedSecondary,
          });
        }
      } else {
        const createPayload = cleanedSecondary && typeof cleanedSecondary === "object"
          ? { ...(cleanedSecondary as Record<string, unknown>) }
          : cleanedSecondary;
        if (createPayload && typeof createPayload === "object") {
          delete (createPayload as Record<string, unknown>).id;
          delete (createPayload as Record<string, unknown>).documentId;
        }
        const createResponse = await fetch(`${strapiUrl}/api/secondary-educations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          body: JSON.stringify({ data: createPayload }),
        });
        
        const createResult = await createResponse.json().catch(() => ({}));
        if (createResponse.ok) {
          secondaryEducationId = createResult?.data?.id;
          secondaryEducationDocumentId = createResult?.data?.documentId || null;
        } else {
          console.error("Failed to create secondary education:", {
            status: createResponse.status,
            error: createResult,
            cleanedSecondary,
          });
        }
      }
      
      // Link relation (Strapi v5: direct assignment for oneToOne is reliable)
      if (secondaryEducationDocumentId || secondaryEducationId) {
        updateData.secondary_education = secondaryEducationDocumentId || secondaryEducationId;
      } else {
        delete updateData.secondary_education;
      }
    }
    
    // Handle tertiary_educations relation (oneToMany)
    if (updateData.tertiary_educations && Array.isArray(updateData.tertiary_educations)) {
      console.log("Processing tertiary_educations:", {
        count: updateData.tertiary_educations.length,
        items: updateData.tertiary_educations.map((item: Record<string, unknown>) => ({
          hasId: !!(item?.id),
          institution: item?.institution as string | undefined,
        })),
      });
      
      let tertiaryIndex = 0;
      for (const tertiaryData of updateData.tertiary_educations) {
        if (tertiaryData && typeof tertiaryData === 'object') {
          const tertiary = tertiaryData as Record<string, unknown>;
          const incomingIdentifier = extractRelationIdentifier((tertiary as { documentId?: unknown })?.documentId ?? tertiary.id);
          const fallbackExisting = existingTertiary[tertiaryIndex] as { id?: unknown; documentId?: unknown } | undefined;
          const fallbackIdentifier = extractRelationIdentifier(fallbackExisting?.documentId ?? fallbackExisting?.id);
          const existingIdentifier = incomingIdentifier ?? fallbackIdentifier;
          
          // Clean the education data
          const cleanedTertiary = cleanComponentRelations(tertiary);
          if (cleanedTertiary && typeof cleanedTertiary === 'object') {
            delete (cleanedTertiary as Record<string, unknown>).id;
            delete (cleanedTertiary as Record<string, unknown>).documentId;
          }
          
          console.log("Tertiary education data:", {
            existingIdentifier,
            cleanedData: cleanedTertiary,
            url: existingIdentifier
              ? `${strapiUrl}/api/tertiar-educations/${existingIdentifier}`
              : `${strapiUrl}/api/tertiar-educations`,
          });
          
          // Create or update tertiary education
          if (existingIdentifier) {
            const updatePayload = cleanedTertiary && typeof cleanedTertiary === "object"
              ? { ...(cleanedTertiary as Record<string, unknown>) }
              : cleanedTertiary;
            if (updatePayload && typeof updatePayload === "object") {
              delete (updatePayload as Record<string, unknown>).id;
              delete (updatePayload as Record<string, unknown>).documentId;
            }
            const updateResponse = await fetch(`${strapiUrl}/api/tertiar-educations/${existingIdentifier}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(authToken && { Authorization: `Bearer ${authToken}` }),
              },
              body: JSON.stringify({ data: updatePayload }),
            });
            
            const updateResult = await updateResponse.json().catch(() => ({}));
            
            if (updateResponse.ok) {
              const tertiaryId =
                updateResult?.data?.documentId || updateResult?.data?.id || existingIdentifier;
              if (tertiaryId) {
                tertiaryEducationIdentifiers.push(tertiaryId);
                console.log("Tertiary education updated successfully:", tertiaryId);
              }
            } else {
              console.error("Failed to update tertiary education:", {
                status: updateResponse.status,
                error: updateResult,
                existingIdentifier,
                url: `${strapiUrl}/api/tertiar-educations/${existingIdentifier}`,
              });
            }
          } else {
            // Use the correct endpoint name: tertiar-educations (note the spelling)
            const createPayload = cleanedTertiary && typeof cleanedTertiary === "object"
              ? { ...(cleanedTertiary as Record<string, unknown>) }
              : cleanedTertiary;
            if (createPayload && typeof createPayload === "object") {
              delete (createPayload as Record<string, unknown>).id;
              delete (createPayload as Record<string, unknown>).documentId;
            }
            const createResponse = await fetch(`${strapiUrl}/api/tertiar-educations`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(authToken && { Authorization: `Bearer ${authToken}` }),
              },
              body: JSON.stringify({ data: createPayload }),
            });
            
            const createResult = await createResponse.json().catch(() => ({}));
            
            if (createResponse.ok) {
              const tertiaryId = createResult?.data?.documentId || createResult?.data?.id;
              if (tertiaryId) {
                tertiaryEducationIdentifiers.push(tertiaryId);
                console.log("Tertiary education created successfully:", tertiaryId);
              } else {
                console.error("Tertiary education created but no ID returned:", createResult);
              }
            } else {
              console.error("Failed to create tertiary education:", {
                status: createResponse.status,
                error: createResult,
                cleanedData: cleanedTertiary,
                url: `${strapiUrl}/api/tertiar-educations`,
              });
            }
          }
        }
        tertiaryIndex += 1;
      }
      
      console.log("Tertiary education IDs collected:", tertiaryEducationIdentifiers);
      
      // Replace with relation format (oneToMany uses set)
      if (tertiaryEducationIdentifiers.length > 0) {
        updateData.tertiary_educations = { set: tertiaryEducationIdentifiers };
        console.log("Setting tertiary_educations relation:", updateData.tertiary_educations);
      } else {
        console.warn("No tertiary education IDs collected, removing from update");
        delete updateData.tertiary_educations;
      }
    }
    
    // Handle professional_experiences relation (oneToMany)
    const professionalExperienceIdentifiers: Array<string | number> = [];
    if (updateData.professional_experiences && Array.isArray(updateData.professional_experiences)) {
      console.log("Processing professional_experiences:", {
        count: updateData.professional_experiences.length,
      });
      
      let professionalIndex = 0;
      for (const professionalData of updateData.professional_experiences) {
        if (professionalData && typeof professionalData === 'object') {
          const professional = professionalData as Record<string, unknown>;
          const incomingIdentifier = extractRelationIdentifier((professional as { documentId?: unknown })?.documentId ?? professional.id);
          const fallbackExisting = existingProfessional[professionalIndex] as { id?: unknown; documentId?: unknown } | undefined;
          const fallbackIdentifier = extractRelationIdentifier(fallbackExisting?.documentId ?? fallbackExisting?.id);
          const existingIdentifier = incomingIdentifier ?? fallbackIdentifier;
          
          // Remove id from data
          const cleanedProfessional = { ...professional };
          delete cleanedProfessional.id;
          
          console.log("Professional experience data:", {
            existingIdentifier,
            cleanedData: cleanedProfessional,
            hasAttachments: !!cleanedProfessional.attachments,
            attachmentsValue: cleanedProfessional.attachments,
            url: existingIdentifier
              ? `${strapiUrl}/api/professional-experiences/${existingIdentifier}`
              : `${strapiUrl}/api/professional-experiences`,
          });
          
          // Create or update professional experience
          if (existingIdentifier) {
            const updateResponse = await fetch(`${strapiUrl}/api/professional-experiences/${existingIdentifier}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(authToken && { Authorization: `Bearer ${authToken}` }),
              },
              body: JSON.stringify({ data: cleanedProfessional }),
            });
            
            const updateResult = await updateResponse.json().catch(() => ({}));
            
            if (updateResponse.ok) {
              const professionalId =
                updateResult?.data?.documentId || updateResult?.data?.id || existingIdentifier;
              if (professionalId) {
                professionalExperienceIdentifiers.push(professionalId);
                console.log("Professional experience updated successfully:", professionalId);
              }
            } else {
              console.error("Failed to update professional experience:", {
                status: updateResponse.status,
                error: updateResult,
                existingIdentifier,
              });
            }
          } else {
            const createResponse = await fetch(`${strapiUrl}/api/professional-experiences`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(authToken && { Authorization: `Bearer ${authToken}` }),
              },
              body: JSON.stringify({ data: cleanedProfessional }),
            });
            
            const createResult = await createResponse.json().catch(() => ({}));
            
            if (createResponse.ok) {
              const professionalId = createResult?.data?.documentId || createResult?.data?.id;
              if (professionalId) {
                professionalExperienceIdentifiers.push(professionalId);
                console.log("Professional experience created successfully:", professionalId);
              } else {
                console.error("Professional experience created but no ID returned:", createResult);
              }
            } else {
              console.error("Failed to create professional experience:", {
                status: createResponse.status,
                error: createResult,
                url: `${strapiUrl}/api/professional-experiences`,
              });
            }
          }
        }
        professionalIndex += 1;
      }
      
      // Replace with relation format (oneToMany uses set)
      if (professionalExperienceIdentifiers.length > 0) {
        updateData.professional_experiences = { set: professionalExperienceIdentifiers };
        console.log("Setting professional_experiences relation:", updateData.professional_experiences);
      } else {
        console.warn("No professional experience IDs collected, removing from update");
        delete updateData.professional_experiences;
      }
    }
    
    // Handle research_engagements relation (oneToMany)
    const researchEngagementIdentifiers: Array<string | number> = [];
    if (updateData.research_engagements && Array.isArray(updateData.research_engagements)) {
      console.log("Processing research_engagements:", {
        count: updateData.research_engagements.length,
      });
      
      let researchIndex = 0;
      for (const researchData of updateData.research_engagements) {
        if (researchData && typeof researchData === 'object') {
          const research = researchData as Record<string, unknown>;
          const incomingIdentifier = extractRelationIdentifier((research as { documentId?: unknown })?.documentId ?? research.id);
          const fallbackExisting = existingResearch[researchIndex] as { id?: unknown; documentId?: unknown } | undefined;
          const fallbackIdentifier = extractRelationIdentifier(fallbackExisting?.documentId ?? fallbackExisting?.id);
          const existingIdentifier = incomingIdentifier ?? fallbackIdentifier;
          
          // Remove id from data
          const cleanedResearch = { ...research };
          delete cleanedResearch.id;
          
          console.log("Research engagement data:", {
            existingIdentifier,
            cleanedData: cleanedResearch,
            hasAttachments: !!cleanedResearch.attachments,
            attachmentsValue: cleanedResearch.attachments,
            url: existingIdentifier
              ? `${strapiUrl}/api/research-engagements/${existingIdentifier}`
              : `${strapiUrl}/api/research-engagements`,
          });
          
          // Create or update research engagement
          if (existingIdentifier) {
            const updateResponse = await fetch(`${strapiUrl}/api/research-engagements/${existingIdentifier}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(authToken && { Authorization: `Bearer ${authToken}` }),
              },
              body: JSON.stringify({ data: cleanedResearch }),
            });
            
            const updateResult = await updateResponse.json().catch(() => ({}));
            
            if (updateResponse.ok) {
              const researchId =
                updateResult?.data?.documentId || updateResult?.data?.id || existingIdentifier;
              if (researchId) {
                researchEngagementIdentifiers.push(researchId);
                console.log("Research engagement updated successfully:", researchId);
              }
            } else {
              console.error("Failed to update research engagement:", {
                status: updateResponse.status,
                error: updateResult,
                existingIdentifier,
              });
            }
          } else {
            const createResponse = await fetch(`${strapiUrl}/api/research-engagements`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(authToken && { Authorization: `Bearer ${authToken}` }),
              },
              body: JSON.stringify({ data: cleanedResearch }),
            });
            
            const createResult = await createResponse.json().catch(() => ({}));
            
            if (createResponse.ok) {
              const researchId = createResult?.data?.documentId || createResult?.data?.id;
              if (researchId) {
                researchEngagementIdentifiers.push(researchId);
                console.log("Research engagement created successfully:", researchId);
              } else {
                console.error("Research engagement created but no ID returned:", createResult);
              }
            } else {
              console.error("Failed to create research engagement:", {
                status: createResponse.status,
                error: createResult,
                url: `${strapiUrl}/api/research-engagements`,
              });
            }
          }
        }
        researchIndex += 1;
      }
      
      // Replace with relation format (oneToMany uses set)
      if (researchEngagementIdentifiers.length > 0) {
        updateData.research_engagements = { set: researchEngagementIdentifiers };
        console.log("Setting research_engagements relation:", updateData.research_engagements);
      } else {
        console.warn("No research engagement IDs collected, removing from update");
        delete updateData.research_engagements;
      }
    }


    const updateUrl = `${strapiUrl}/api/student-profiles/${finalIdentifier}?populate=*`;
    
    console.log("Updating profile:", {
      actualId: actualProfileId,
      actualDocumentId,
      usingIdentifier: finalIdentifier,
      updateUrl,
      updateDataKeys: Object.keys(updateData),
      hasSpecialNeed: 'specialNeed' in updateData,
      specialNeedValue: updateData.specialNeed,
      hasSpecialNeedDescription: 'specialNeedDescription' in updateData,
      specialNeedDescriptionValue: updateData.specialNeedDescription,
      hasResidentialAddress: 'residentialAddress' in updateData,
      residentialAddress: updateData.residentialAddress ? JSON.stringify(updateData.residentialAddress).substring(0, 200) : null,
      hasBirthAddress: 'birthAddress' in updateData,
      hasPersonToBeContacted: 'personToBeContacted' in updateData,
    });

    // Try with user JWT first, fall back to API token if 403
    let response = await fetch(updateUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(userJwt && { Authorization: `Bearer ${userJwt}` }),
        ...(!userJwt && apiToken && { Authorization: `Bearer ${apiToken}` }),
      },
      body: JSON.stringify({ data: updateData }),
    });

    let responseText = await response.text();
    let result: Record<string, unknown> = {};
    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch {
        result = { error: responseText };
      }
    }

    // If we got 403 with user JWT, try with API token
    if (!response.ok && response.status === 403 && userJwt && apiToken) {
      console.log("Got 403 with user JWT, retrying with API token...", {
        firstAttemptStatus: response.status,
        firstAttemptError: result,
        updateUrl,
        hasUpdateData: !!updateData,
        updateDataKeys: Object.keys(updateData),
      });
      
      response = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
        },
        body: JSON.stringify({ data: updateData }),
      });
      
      responseText = await response.text();
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch {
          result = { error: responseText };
        }
      }
      
      console.log("API token retry result:", {
        ok: response.ok,
        status: response.status,
        error: result?.error || null,
        hasData: !!result?.data,
        errorMessage: (result?.error as { message?: string })?.message || result?.error || result?.message,
      });
      
      if (response.ok) {
        console.log("Update succeeded with API token after 403 with user JWT");
        return NextResponse.json(result, { status: 200 });
      } else {
        console.error("API token retry also failed:", {
          status: response.status,
          error: result,
          errorMessage: (result?.error as { message?: string })?.message || result?.error || result?.message,
          updateDataSample: JSON.stringify(updateData).substring(0, 500),
        });
      }
    }

    if (!response.ok) {
      const errorMessage =
        (result?.error as { message?: string })?.message ||
        (result?.error as string) ||
        result?.message ||
        "Failed to update student profile";
      
      console.error("Update failed:", {
        status: response.status,
        error: result,
        usingIdentifier: finalIdentifier,
        triedUserJwt: !!userJwt,
        triedApiToken: !!apiToken,
      });
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Student profile update error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update student profile";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

