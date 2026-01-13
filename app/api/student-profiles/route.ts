import { NextRequest, NextResponse } from "next/server";
import { getStrapiURL } from "@/lib/strapi/client";
import { getSession } from "@/lib/auth/session";

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

    // Use the user's JWT token from session for authenticated requests
    // This allows the user to create/update their own profile using their permissions
    // Fall back to API token if JWT is not available
    const userJwt = session.jwt;
    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
    const authToken = userJwt || apiToken;

    // Associate the profile with the logged-in user
    // Remove email field if present (not in Strapi schema)
    const profileData = Object.fromEntries(
      Object.entries(body.data).filter(([key]) => key !== 'email')
    );
    
    // Set the user relation to associate this profile with the logged-in user
    profileData.user = Number(session.userId);

    // Helper function to clean component relations (for addresses)
    const cleanComponentRelations = (obj: Record<string, unknown> | null | undefined): Record<string, unknown> | null | undefined => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
      
      const cleaned: Record<string, unknown> = {};
      
      // Process all fields
      for (const [key, value] of Object.entries(obj)) {
        // For relation fields (country, region, zone, woreda), ensure they're just numbers
        if (['country', 'region', 'zone', 'woreda'].includes(key)) {
          if (typeof value === 'number') {
            cleaned[key] = value;
          } else if (value && typeof value === 'object' && 'set' in value && Array.isArray(value.set)) {
            const setId = value.set[0]?.id;
            if (setId && typeof setId === 'number') {
              cleaned[key] = setId;
            }
          } else if (value !== null && value !== undefined) {
            const numValue = Number(value);
            if (!isNaN(numValue) && numValue > 0) {
              cleaned[key] = numValue;
            }
          }
        } else {
          // For other fields, keep as is
          cleaned[key] = value;
        }
      }
      return cleaned;
    };

    // Education fields are RELATIONS, not components
    // We need to create the education records first, then link them
    let primaryEducationId: number | null = null;
    let secondaryEducationId: number | null = null;
    const tertiaryEducationIds: number[] = [];
    
    // Handle primary_education relation
    if (profileData.primary_education && typeof profileData.primary_education === 'object') {
      const primaryData = profileData.primary_education as Record<string, unknown>;
      const cleanedPrimary = cleanComponentRelations(primaryData);
      if (cleanedPrimary && typeof cleanedPrimary === 'object') {
        delete (cleanedPrimary as Record<string, unknown>).id;
      }
      
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
      }
      
      // Replace with relation format
      if (primaryEducationId) {
        profileData.primary_education = { id: primaryEducationId };
      } else {
        delete profileData.primary_education;
      }
    }
    
    // Handle secondary_education relation
    if (profileData.secondary_education && typeof profileData.secondary_education === 'object') {
      const secondaryData = profileData.secondary_education as Record<string, unknown>;
      const cleanedSecondary = cleanComponentRelations(secondaryData);
      if (cleanedSecondary && typeof cleanedSecondary === 'object') {
        delete (cleanedSecondary as Record<string, unknown>).id;
      }
      
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
      }
      
      // Replace with relation format
      if (secondaryEducationId) {
        profileData.secondary_education = { id: secondaryEducationId };
      } else {
        delete profileData.secondary_education;
      }
    }
    
    // Handle tertiary_educations relation (oneToMany)
    if (profileData.tertiary_educations && Array.isArray(profileData.tertiary_educations)) {
      for (const tertiaryData of profileData.tertiary_educations) {
        if (tertiaryData && typeof tertiaryData === 'object') {
          const tertiary = tertiaryData as Record<string, unknown>;
          const cleanedTertiary = cleanComponentRelations(tertiary);
          if (cleanedTertiary && typeof cleanedTertiary === 'object') {
            delete (cleanedTertiary as Record<string, unknown>).id;
          }
          
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
            if (createResult?.data?.id) {
              tertiaryEducationIds.push(createResult.data.id);
              console.log("Tertiary education created (POST):", createResult.data.id);
            } else {
              console.error("Tertiary education created but no ID returned (POST):", createResult);
            }
          } else {
            console.error("Failed to create tertiary education (POST):", {
              status: createResponse.status,
              error: createResult,
              url: `${strapiUrl}/api/tertiar-educations`,
            });
          }
        }
      }
      
      // Replace with relation format (oneToMany uses set)
      if (tertiaryEducationIds.length > 0) {
        profileData.tertiary_educations = { set: tertiaryEducationIds.map(id => ({ id })) };
        console.log("Setting tertiary_educations relation (POST):", profileData.tertiary_educations);
      } else {
        console.warn("No tertiary education IDs collected (POST), removing from profile data");
        delete profileData.tertiary_educations;
      }
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
      
      console.error("Strapi API error:", {
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
    
    // Add user filter (we don't need to populate user, just filter by it)
    const userId = Number(session.userId);
    queryStringParts.push(`filters[user][id][$eq]=${userId}`);
    
    const url = `${strapiUrl}/api/student-profiles?${queryStringParts.join('&')}`;
    
    console.log("Fetching profile:", { 
      originalQuery,
      decodedQuery,
      populateParams,
      queryStringParts,
      url,
      userId 
    });
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Strapi fetch error:", { status: response.status, error: result });
      const errorMessage =
        result?.error?.message ||
        result?.message ||
        "Failed to fetch student profiles";
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      );
    }

    console.log("Strapi response:", { 
      hasData: !!result?.data, 
      isArray: Array.isArray(result?.data),
      dataLength: Array.isArray(result?.data) ? result.data.length : result?.data ? 1 : 0,
      firstProfileUserId: Array.isArray(result?.data) ? result.data[0]?.user?.id : result?.data?.user?.id,
    });

    // Strapi should return only the user's profile due to the filter
    // But we still validate server-side for security
    let filteredData = null;
    
    type ProfileData = {
      user?: {
        id?: number;
      };
      [key: string]: unknown;
    };
    
    if (result?.data) {
      if (Array.isArray(result.data)) {
        // Filter should have already filtered by user, so return first match or first item
        const userId = Number(session.userId);
        filteredData = result.data.find((profile: ProfileData) => {
          return profile.user?.id === userId;
        }) || result.data[0] || null;
      } else if (result.data) {
        // Single object - filter should have worked, so return it
        filteredData = result.data;
      }
    }
    
    console.log("Final filtered data:", { 
      hasData: !!filteredData, 
      profileId: filteredData?.id,
      hasResidentialAddress: !!filteredData?.residentialAddress 
    });

    // Return only the user's profile or null
    return NextResponse.json(
      { 
        data: filteredData, 
        meta: result.meta || { pagination: { total: filteredData ? 1 : 0 } } 
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

    const { id, ...restData } = body.data;

    if (!id) {
      return NextResponse.json(
        { error: "Profile ID is required for update" },
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

    // Use the user's JWT token from session for authenticated requests
    // Fall back to API token if JWT is not available
    const userJwt = session.jwt;
    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
    const authToken = userJwt || apiToken;

    // Verify the profile exists and belongs to the logged-in user
    // Use user filter instead of direct ID lookup to avoid Strapi permission issues
    const userId = Number(session.userId);
    const userProfileUrl = `${strapiUrl}/api/student-profiles?filters[user][id][$eq]=${userId}&populate=user`;
    
    console.log("Verifying profile ownership:", { profileId: id, userId, verifyUrl: userProfileUrl });
    
    const verifyResponse = await fetch(userProfileUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
    });

    if (!verifyResponse.ok) {
      const verifyError = await verifyResponse.json().catch(() => ({}));
      console.error("Profile verification failed:", {
        status: verifyResponse.status,
        profileId: id,
        userId,
        error: verifyError,
      });
      
      return NextResponse.json(
        { error: "Failed to verify profile ownership" },
        { status: verifyResponse.status || 500 }
      );
    }

    const verifyResult = await verifyResponse.json().catch(() => ({}));
    const userProfiles = Array.isArray(verifyResult?.data) ? verifyResult.data : (verifyResult?.data ? [verifyResult.data] : []);
    const profile = userProfiles.find((p: { id?: number }) => p?.id === id);
    
    console.log("Profile verification result:", {
      requestedProfileId: id,
      foundProfileId: profile?.id,
      profileUserId: profile?.user?.id,
      loggedInUserId: userId,
      found: !!profile,
      totalUserProfiles: userProfiles.length,
    });

    // Verify we found the profile with the requested ID
    // If not found but user has profiles, use the actual profile ID
    let actualProfileId = id;
    if (!profile || profile.id !== id) {
      if (userProfiles.length > 0) {
        const actualProfile = userProfiles[0];
        actualProfileId = actualProfile?.id;
        console.error("Profile ID mismatch:", {
          requestedId: id,
          actualProfileId,
          userId,
        });
        
        // Use the actual profile instead of the requested one
        // This handles cases where the profile ID changed
        if (actualProfile) {
          console.log("Using actual profile ID:", actualProfileId, "instead of requested:", id);
          // Update the profile reference to use the actual one
          Object.assign(profile || {}, actualProfile);
        } else {
          return NextResponse.json(
            { 
              error: "Profile ID mismatch. Please refresh the page and try again.",
              details: { requestedId: id, actualProfileId }
            },
            { status: 400 }
          );
        }
      } else {
        console.error("Profile not found in user's profiles:", {
          requestedId: id,
          userId,
        });
        
        return NextResponse.json(
          { error: "Student profile not found" },
          { status: 404 }
        );
      }
    }

    // Verify the profile belongs to the logged-in user (double-check)
    if (profile?.user?.id !== userId) {
      console.error("Profile ownership mismatch:", {
        profileUserId: profile?.user?.id,
        loggedInUserId: userId,
        profileId: id,
      });
      
      return NextResponse.json(
        { error: "You do not have permission to update this profile" },
        { status: 403 }
      );
    }

    // Remove email and id fields if present
    // id should not be in the update payload - Strapi identifies records by URL parameter
    const updateData = Object.fromEntries(
      Object.entries(restData).filter(([key]) => key !== 'email' && key !== 'id')
    );

    // Helper function to clean component relations
    // For components, relations should be just the ID number, not wrapped in { set: [...] }
    // Strapi v4 requires component IDs for updates, and relations within components should be plain numbers
    const cleanComponentRelations = (obj: Record<string, unknown> | null | undefined): Record<string, unknown> | null | undefined => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
      
      const cleaned: Record<string, unknown> = {};
      
      // Preserve the component ID if it exists
      if (obj.id && typeof obj.id === 'number') {
        cleaned.id = obj.id;
      }
      
      // Process all other fields
      for (const [key, value] of Object.entries(obj)) {
        // Skip 'id' as we already handled it
        if (key === 'id') continue;
        
        // For relation fields (country, region, zone, woreda), ensure they're just numbers
        // Remove any wrapping like { set: [...] } that Strapi might have added
        if (['country', 'region', 'zone', 'woreda'].includes(key)) {
          if (typeof value === 'number') {
            cleaned[key] = value;
          } else if (value && typeof value === 'object' && 'set' in value && Array.isArray(value.set)) {
            // If Strapi wrapped it in { set: [...] }, extract the ID
            const setId = value.set[0]?.id;
            if (setId && typeof setId === 'number') {
              cleaned[key] = setId;
            }
          } else if (value !== null && value !== undefined) {
            const numValue = Number(value);
            if (!isNaN(numValue) && numValue > 0) {
              cleaned[key] = numValue;
            }
          }
        } else {
          // For other fields, keep as is (recursively clean if it's an object)
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            cleaned[key] = cleanComponentRelations(value as Record<string, unknown>);
          } else {
            cleaned[key] = value;
          }
        }
      }
      return cleaned;
    };

    // Clean component relations in nested objects (addresses are components)
    if (updateData.residentialAddress && typeof updateData.residentialAddress === 'object') {
      updateData.residentialAddress = cleanComponentRelations(updateData.residentialAddress as Record<string, unknown>) as typeof updateData.residentialAddress;
    }
    if (updateData.birthAddress && typeof updateData.birthAddress === 'object') {
      updateData.birthAddress = cleanComponentRelations(updateData.birthAddress as Record<string, unknown>) as typeof updateData.birthAddress;
    }
    if (updateData.personToBeContacted && typeof updateData.personToBeContacted === 'object') {
      updateData.personToBeContacted = cleanComponentRelations(updateData.personToBeContacted as Record<string, unknown>) as typeof updateData.personToBeContacted;
    }
    
    // Education fields are RELATIONS, not components
    // We need to create/update the education records first, then link them
    let primaryEducationId: number | null = null;
    let secondaryEducationId: number | null = null;
    const tertiaryEducationIds: number[] = [];
    
    // Handle primary_education relation
    if (updateData.primary_education && typeof updateData.primary_education === 'object') {
      const primaryData = updateData.primary_education as Record<string, unknown>;
      const existingId = primaryData.id as number | undefined;
      
      // Clean the education data (remove id, clean location relations)
      const cleanedPrimary = cleanComponentRelations(primaryData);
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
        }
      }
      
      // Replace with relation format
      if (primaryEducationId) {
        updateData.primary_education = { id: primaryEducationId };
      } else {
        delete updateData.primary_education;
      }
    }
    
    // Handle secondary_education relation
    if (updateData.secondary_education && typeof updateData.secondary_education === 'object') {
      const secondaryData = updateData.secondary_education as Record<string, unknown>;
      const existingId = secondaryData.id as number | undefined;
      
      // Clean the education data
      const cleanedSecondary = cleanComponentRelations(secondaryData);
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
        }
      }
      
      // Replace with relation format
      if (secondaryEducationId) {
        updateData.secondary_education = { id: secondaryEducationId };
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
      
      for (const tertiaryData of updateData.tertiary_educations) {
        if (tertiaryData && typeof tertiaryData === 'object') {
          const tertiary = tertiaryData as Record<string, unknown>;
          const existingId = tertiary.id as number | undefined;
          
          // Clean the education data
          const cleanedTertiary = cleanComponentRelations(tertiary);
          if (cleanedTertiary && typeof cleanedTertiary === 'object') {
            delete (cleanedTertiary as Record<string, unknown>).id;
          }
          
          console.log("Tertiary education data:", {
            existingId,
            cleanedData: cleanedTertiary,
            url: existingId 
              ? `${strapiUrl}/api/tertiar-educations/${existingId}`
              : `${strapiUrl}/api/tertiar-educations`,
          });
          
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
              const tertiaryId = updateResult?.data?.id || existingId;
              if (tertiaryId) {
                tertiaryEducationIds.push(tertiaryId);
                console.log("Tertiary education updated successfully:", tertiaryId);
              }
            } else {
              console.error("Failed to update tertiary education:", {
                status: updateResponse.status,
                error: updateResult,
                existingId,
                url: `${strapiUrl}/api/tertiar-educations/${existingId}`,
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
              if (createResult?.data?.id) {
                tertiaryEducationIds.push(createResult.data.id);
                console.log("Tertiary education created successfully:", createResult.data.id);
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
      }
      
      console.log("Tertiary education IDs collected:", tertiaryEducationIds);
      
      // Replace with relation format (oneToMany uses set)
      if (tertiaryEducationIds.length > 0) {
        updateData.tertiary_educations = { set: tertiaryEducationIds.map(id => ({ id })) };
        console.log("Setting tertiary_educations relation:", updateData.tertiary_educations);
      } else {
        console.warn("No tertiary education IDs collected, removing from update");
        delete updateData.tertiary_educations;
      }
    }
    
    // Handle professional_experiences relation (oneToMany)
    const professionalExperienceIds: number[] = [];
    if (updateData.professional_experiences && Array.isArray(updateData.professional_experiences)) {
      console.log("Processing professional_experiences:", {
        count: updateData.professional_experiences.length,
      });
      
      for (const professionalData of updateData.professional_experiences) {
        if (professionalData && typeof professionalData === 'object') {
          const professional = professionalData as Record<string, unknown>;
          const existingId = professional.id as number | undefined;
          
          // Remove id from data
          const cleanedProfessional = { ...professional };
          delete cleanedProfessional.id;
          
          console.log("Professional experience data:", {
            existingId,
            cleanedData: cleanedProfessional,
            hasAttachments: !!cleanedProfessional.attachments,
            attachmentsValue: cleanedProfessional.attachments,
            url: existingId 
              ? `${strapiUrl}/api/professional-experiences/${existingId}`
              : `${strapiUrl}/api/professional-experiences`,
          });
          
          // Create or update professional experience
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
              const professionalId = updateResult?.data?.id || existingId;
              if (professionalId) {
                professionalExperienceIds.push(professionalId);
                console.log("Professional experience updated successfully:", professionalId);
              }
            } else {
              console.error("Failed to update professional experience:", {
                status: updateResponse.status,
                error: updateResult,
                existingId,
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
              if (createResult?.data?.id) {
                professionalExperienceIds.push(createResult.data.id);
                console.log("Professional experience created successfully:", createResult.data.id);
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
      }
      
      // Replace with relation format (oneToMany uses set)
      if (professionalExperienceIds.length > 0) {
        updateData.professional_experiences = { set: professionalExperienceIds.map(id => ({ id })) };
        console.log("Setting professional_experiences relation:", updateData.professional_experiences);
      } else {
        console.warn("No professional experience IDs collected, removing from update");
        delete updateData.professional_experiences;
      }
    }
    
    // Handle research_engagements relation (oneToMany)
    const researchEngagementIds: number[] = [];
    if (updateData.research_engagements && Array.isArray(updateData.research_engagements)) {
      console.log("Processing research_engagements:", {
        count: updateData.research_engagements.length,
      });
      
      for (const researchData of updateData.research_engagements) {
        if (researchData && typeof researchData === 'object') {
          const research = researchData as Record<string, unknown>;
          const existingId = research.id as number | undefined;
          
          // Remove id from data
          const cleanedResearch = { ...research };
          delete cleanedResearch.id;
          
          console.log("Research engagement data:", {
            existingId,
            cleanedData: cleanedResearch,
            hasAttachments: !!cleanedResearch.attachments,
            attachmentsValue: cleanedResearch.attachments,
            url: existingId 
              ? `${strapiUrl}/api/research-engagements/${existingId}`
              : `${strapiUrl}/api/research-engagements`,
          });
          
          // Create or update research engagement
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
              const researchId = updateResult?.data?.id || existingId;
              if (researchId) {
                researchEngagementIds.push(researchId);
                console.log("Research engagement updated successfully:", researchId);
              }
            } else {
              console.error("Failed to update research engagement:", {
                status: updateResponse.status,
                error: updateResult,
                existingId,
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
              if (createResult?.data?.id) {
                researchEngagementIds.push(createResult.data.id);
                console.log("Research engagement created successfully:", createResult.data.id);
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
      }
      
      // Replace with relation format (oneToMany uses set)
      if (researchEngagementIds.length > 0) {
        updateData.research_engagements = { set: researchEngagementIds.map(id => ({ id })) };
        console.log("Setting research_engagements relation:", updateData.research_engagements);
      } else {
        console.warn("No research engagement IDs collected, removing from update");
        delete updateData.research_engagements;
      }
    }

    // Update the profile
    // Use user's JWT for the update since we've verified ownership
    // Strapi permissions may require the user's own token for updates
    // Try user JWT first, fall back to API token if needed
    
    // Remove id from components - Strapi doesn't allow id in component payloads
    // Components are updated by field name, not by id
    const removeIdFromComponent = (obj: Record<string, unknown> | null | undefined): Record<string, unknown> | null | undefined => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
      const cleaned = { ...obj };
      delete cleaned.id;
      return cleaned;
    };

    // Remove ids from components only (addresses are components)
    // NOTE: Education fields are relations, not components, so they're already handled above
    if (updateData.residentialAddress && typeof updateData.residentialAddress === 'object') {
      updateData.residentialAddress = removeIdFromComponent(updateData.residentialAddress as Record<string, unknown>) as typeof updateData.residentialAddress;
    }
    if (updateData.birthAddress && typeof updateData.birthAddress === 'object') {
      updateData.birthAddress = removeIdFromComponent(updateData.birthAddress as Record<string, unknown>) as typeof updateData.birthAddress;
    }
    if (updateData.personToBeContacted && typeof updateData.personToBeContacted === 'object') {
      updateData.personToBeContacted = removeIdFromComponent(updateData.personToBeContacted as Record<string, unknown>) as typeof updateData.personToBeContacted;
    }
    
    // Try using numeric ID first, fall back to documentId if needed
    // Use actualProfileId if it differs from requested id
    const profileDocumentId = (profile as { documentId?: string })?.documentId;
    let updateUrl = `${strapiUrl}/api/student-profiles/${actualProfileId}`;
    
    console.log("Updating profile (trying numeric ID first):", {
      requestedProfileId: id,
      actualProfileId,
      documentId: profileDocumentId,
      userId,
      usingUserJwt: !!userJwt,
      updateUrl,
      updateDataKeys: Object.keys(updateData),
      residentialAddress: updateData.residentialAddress ? JSON.stringify(updateData.residentialAddress).substring(0, 200) : null,
    });
    
    // Try with user's JWT first using numeric ID
    let response = await fetch(updateUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(userJwt && { Authorization: `Bearer ${userJwt}` }),
      },
      body: JSON.stringify({
        data: updateData,
      }),
    });

    let result = await response.json().catch(() => ({}));
    
    console.log("First update attempt result:", {
      ok: response.ok,
      status: response.status,
      usingUserJwt: !!userJwt,
      hasApiToken: !!apiToken,
      error: result?.error || null,
    });

    // If we got 403 with user JWT, immediately try with API token on numeric ID
    if (!response.ok && response.status === 403 && userJwt && apiToken) {
      console.log("Got 403 with user JWT on numeric ID, retrying with API token...");
      response = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
        },
        body: JSON.stringify({
          data: updateData,
        }),
      });
      result = await response.json().catch(() => ({}));
      console.log("API token retry result:", {
        ok: response.ok,
        status: response.status,
        error: result?.error || null,
      });
    }

    // If numeric ID failed with 404 (or still 403 after API token), try with documentId
    if (!response.ok && (response.status === 404 || response.status === 403) && profileDocumentId) {
      console.log("Numeric ID failed, trying with documentId...");
      
      // First, verify the documentId exists by fetching it
      const verifyDocIdUrl = `${strapiUrl}/api/student-profiles/${profileDocumentId}`;
      const verifyDocIdResponse = await fetch(verifyDocIdUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
        },
      });
      
      if (verifyDocIdResponse.ok) {
        const verifyDocIdResult = await verifyDocIdResponse.json().catch(() => ({}));
        const docIdProfile = verifyDocIdResult?.data;
        
        if (docIdProfile && docIdProfile.id === actualProfileId) {
          console.log("DocumentId verified, proceeding with update using documentId");
          
          // When using documentId, do NOT include id in the payload
          // Strapi identifies the record by documentId in the URL
          // Remove any id field from updateData to avoid "Invalid key id" error
          const updateDataForDocumentId = { ...updateData };
          delete (updateDataForDocumentId as Record<string, unknown>).id;
          
          updateUrl = `${strapiUrl}/api/student-profiles/${profileDocumentId}`;
          
          console.log("Attempting update with documentId:", {
            documentId: profileDocumentId,
            updateDataKeys: Object.keys(updateDataForDocumentId),
            hasApiToken: !!apiToken,
            url: updateUrl,
          });
          
          // Use API token for documentId updates as it typically has more permissions
          // User JWT might not have permission to update via documentId
          response = await fetch(updateUrl, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
            },
            body: JSON.stringify({
              data: updateDataForDocumentId,
            }),
          });
          result = await response.json().catch(() => ({}));
          
          console.log("DocumentId update result:", {
            ok: response.ok,
            status: response.status,
            error: result?.error || null,
            returnedId: result?.data?.id || null,
          });
          
          // If documentId update failed with 403, try numeric ID with API token as final fallback
          if (!response.ok && response.status === 403 && apiToken) {
            console.log("DocumentId update failed with 403, trying numeric ID with API token as final fallback...");
            const numericUpdateUrl = `${strapiUrl}/api/student-profiles/${actualProfileId}`;
            response = await fetch(numericUpdateUrl, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
              },
              body: JSON.stringify({
                data: updateData,
              }),
            });
            result = await response.json().catch(() => ({}));
            console.log("Final numeric ID with API token result:", {
              ok: response.ok,
              status: response.status,
              error: result?.error || null,
            });
          }
          
          // Check if update created a new profile (different ID returned)
          if (response.ok && result?.data?.id && result.data.id !== actualProfileId) {
            console.error("Update with documentId created a new profile instead of updating:", {
              expectedId: actualProfileId,
              returnedId: result.data.id,
              documentId: profileDocumentId,
            });
            // Return error to prevent profile duplication
            return NextResponse.json(
              { 
                error: "Update failed: Profile ID mismatch. Please refresh the page and try again.",
                details: { 
                  requestedId: actualProfileId, 
                  returnedId: result.data.id,
                  message: "The update created a new profile instead of updating the existing one"
                }
              },
              { status: 400 }
            );
          }
          
          // If documentId update failed with 403, we already tried API token, so no further action needed
          // But if it failed for another reason, we'll fall through to the numeric ID fallback below
        } else {
          console.error("DocumentId verification failed:", {
            documentId: profileDocumentId,
            expectedId: actualProfileId,
            foundId: docIdProfile?.id,
          });
        }
      } else {
        console.error("Could not verify documentId:", {
          documentId: profileDocumentId,
          status: verifyDocIdResponse.status,
        });
      }
    }


    if (!response.ok) {
      console.error("Strapi API error:", {
        status: response.status,
        error: result,
        url: updateUrl,
        triedDocumentId: !!profileDocumentId,
        triedUserJwt: !!userJwt,
        triedApiToken: !!apiToken,
      });

      // If using numeric ID failed and we have documentId, try with documentId
      if (response.status === 404 && !profileDocumentId && (profile as { documentId?: string })?.documentId) {
        const docId = (profile as { documentId?: string }).documentId;
        console.log("Retrying with documentId:", docId);
        const retryAuthToken = userJwt || apiToken;
        const retryResponse = await fetch(`${strapiUrl}/api/student-profiles/${docId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(retryAuthToken && { Authorization: `Bearer ${retryAuthToken}` }),
          },
          body: JSON.stringify({
            data: updateData,
          }),
        });
        
        const retryResult = await retryResponse.json().catch(() => ({}));
        if (retryResponse.ok) {
          return NextResponse.json(retryResult, { status: 200 });
        }
        // If documentId also failed, use the retry result for error message
        result = retryResult;
        response = retryResponse;
      }

      const errorMessage =
        result?.error?.message ||
        result?.message ||
        (response.status === 404 ? "Student profile not found" : 
         response.status === 403 ? "You do not have permission to update this profile. Please check Strapi permissions." :
         "Failed to update student profile");
      
      return NextResponse.json(
        { error: errorMessage, details: result },
        { status: response.status || 500 }
      );
    }

    // Check if the update result has a different ID (new profile created)
    const updatedProfileId = result?.data?.id;
    let finalProfileId = actualProfileId;
    if (updatedProfileId && updatedProfileId !== actualProfileId) {
      console.warn("Update returned different profile ID:", {
        requestedId: id,
        actualProfileId,
        returnedId: updatedProfileId,
        message: "This might indicate a new profile was created instead of updated"
      });
      // Use the returned ID for fetching
      finalProfileId = updatedProfileId;
    }
    
    // Fetch the updated profile with populated components to verify the update
    // Use documentId if available, otherwise use the final profile ID
    const fetchUrl = profileDocumentId 
      ? `${strapiUrl}/api/student-profiles/${profileDocumentId}?populate[residentialAddress][populate]=*&populate[birthAddress][populate]=*&populate[personToBeContacted][populate]=*&populate[primary_education][populate]=*&populate[secondary_education][populate]=*&populate[tertiary_educations][populate]=*&populate[professional_experiences][populate]=*&populate[research_engagements][populate]=*`
      : `${strapiUrl}/api/student-profiles/${finalProfileId}?populate[residentialAddress][populate]=*&populate[birthAddress][populate]=*&populate[personToBeContacted][populate]=*&populate[primary_education][populate]=*&populate[secondary_education][populate]=*&populate[tertiary_educations][populate]=*&populate[professional_experiences][populate]=*&populate[research_engagements][populate]=*`;
    
    const fetchResponse = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(userJwt && { Authorization: `Bearer ${userJwt}` }),
      },
    });
    
    if (fetchResponse.ok) {
      const fetchedResult = await fetchResponse.json().catch(() => ({}));
      const fetchedProfileId = fetchedResult?.data?.id;
      console.log("Fetched updated profile:", {
        requestedId: id,
        actualProfileId,
        finalProfileId,
        fetchedProfileId,
        hasResidentialAddress: !!fetchedResult?.data?.residentialAddress,
        residentialAddressId: fetchedResult?.data?.residentialAddress?.id,
      });
      
      // If the fetched profile has a different ID, include it in the response details
      if (fetchedProfileId && fetchedProfileId !== actualProfileId) {
        return NextResponse.json({
          ...fetchedResult,
          profileIdChanged: true,
          oldProfileId: actualProfileId,
          newProfileId: fetchedProfileId
        }, { status: 200 });
      }
      
      // Return the fetched profile with populated components
      return NextResponse.json(fetchedResult, { status: 200 });
    }
    
    // If fetch failed, return the original result
    console.log("Update successful (could not fetch populated):", {
      profileId: result?.data?.id,
      hasResidentialAddress: !!result?.data?.residentialAddress,
    });
    
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

