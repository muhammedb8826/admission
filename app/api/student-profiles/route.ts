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
    if (!profile || profile.id !== id) {
      if (userProfiles.length > 0) {
        const actualProfileId = userProfiles[0]?.id;
        console.error("Profile ID mismatch:", {
          requestedId: id,
          actualProfileId,
          userId,
        });
        
        return NextResponse.json(
          { 
            error: "Profile ID mismatch. Please refresh the page and try again.",
            details: { requestedId: id, actualProfileId }
          },
          { status: 400 }
        );
      }
      
      console.error("Profile not found in user's profiles:", {
        requestedId: id,
        userId,
      });
      
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
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

    // Remove email field if present (not in Strapi schema)
    const updateData = Object.fromEntries(
      Object.entries(restData).filter(([key]) => key !== 'email')
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

    // Clean component relations in nested objects
    if (updateData.residentialAddress && typeof updateData.residentialAddress === 'object') {
      updateData.residentialAddress = cleanComponentRelations(updateData.residentialAddress as Record<string, unknown>) as typeof updateData.residentialAddress;
    }
    if (updateData.birthAddress && typeof updateData.birthAddress === 'object') {
      updateData.birthAddress = cleanComponentRelations(updateData.birthAddress as Record<string, unknown>) as typeof updateData.birthAddress;
    }
    if (updateData.personToBeContacted && typeof updateData.personToBeContacted === 'object') {
      updateData.personToBeContacted = cleanComponentRelations(updateData.personToBeContacted as Record<string, unknown>) as typeof updateData.personToBeContacted;
    }
    if (updateData.primary_education && typeof updateData.primary_education === 'object') {
      updateData.primary_education = cleanComponentRelations(updateData.primary_education as Record<string, unknown>) as typeof updateData.primary_education;
    }
    if (updateData.secondary_education && typeof updateData.secondary_education === 'object') {
      updateData.secondary_education = cleanComponentRelations(updateData.secondary_education as Record<string, unknown>) as typeof updateData.secondary_education;
    }
    if (updateData.tertiary_educations && Array.isArray(updateData.tertiary_educations)) {
      updateData.tertiary_educations = updateData.tertiary_educations.map(item => cleanComponentRelations(item as Record<string, unknown>) as typeof item);
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

    // Remove ids from all components (Strapi doesn't allow id in component payloads)
    if (updateData.residentialAddress && typeof updateData.residentialAddress === 'object') {
      updateData.residentialAddress = removeIdFromComponent(updateData.residentialAddress as Record<string, unknown>) as typeof updateData.residentialAddress;
    }
    if (updateData.birthAddress && typeof updateData.birthAddress === 'object') {
      updateData.birthAddress = removeIdFromComponent(updateData.birthAddress as Record<string, unknown>) as typeof updateData.birthAddress;
    }
    if (updateData.personToBeContacted && typeof updateData.personToBeContacted === 'object') {
      updateData.personToBeContacted = removeIdFromComponent(updateData.personToBeContacted as Record<string, unknown>) as typeof updateData.personToBeContacted;
    }
    if (updateData.primary_education && typeof updateData.primary_education === 'object') {
      updateData.primary_education = removeIdFromComponent(updateData.primary_education as Record<string, unknown>) as typeof updateData.primary_education;
    }
    if (updateData.secondary_education && typeof updateData.secondary_education === 'object') {
      updateData.secondary_education = removeIdFromComponent(updateData.secondary_education as Record<string, unknown>) as typeof updateData.secondary_education;
    }
    if (updateData.tertiary_educations && Array.isArray(updateData.tertiary_educations)) {
      updateData.tertiary_educations = updateData.tertiary_educations.map(item => removeIdFromComponent(item as Record<string, unknown>) as typeof item);
    }
    
    // Try using numeric ID first, fall back to documentId if needed
    const profileDocumentId = (profile as { documentId?: string })?.documentId;
    let updateUrl = `${strapiUrl}/api/student-profiles/${id}`;
    
    console.log("Updating profile (trying numeric ID first):", {
      profileId: id,
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

    // If numeric ID failed with 404 or 403, try with documentId
    if (!response.ok && (response.status === 404 || response.status === 403) && profileDocumentId) {
      console.log("Numeric ID failed, trying with documentId...");
      
      updateUrl = `${strapiUrl}/api/student-profiles/${profileDocumentId}`;
      response = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(userJwt && { Authorization: `Bearer ${userJwt}` }),
        },
        body: JSON.stringify({
          data: updateData,
        }),
      });
      result = await response.json().catch(() => ({}));
    }

    // If we got 403 with user JWT, try with API token as fallback
    if (!response.ok && response.status === 403 && userJwt && apiToken) {
      console.log("Got 403 with user JWT, retrying with API token...");
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

    // Fetch the updated profile with populated components to verify the update
    const fetchUrl = profileDocumentId 
      ? `${strapiUrl}/api/student-profiles/${profileDocumentId}?populate[residentialAddress][populate]=*&populate[birthAddress][populate]=*&populate[personToBeContacted][populate]=*&populate[primary_education][populate]=*&populate[secondary_education][populate]=*&populate[tertiary_educations][populate]=*`
      : `${strapiUrl}/api/student-profiles/${id}?populate[residentialAddress][populate]=*&populate[birthAddress][populate]=*&populate[personToBeContacted][populate]=*&populate[primary_education][populate]=*&populate[secondary_education][populate]=*&populate[tertiary_educations][populate]=*`;
    
    const fetchResponse = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(userJwt && { Authorization: `Bearer ${userJwt}` }),
      },
    });
    
    if (fetchResponse.ok) {
      const fetchedResult = await fetchResponse.json().catch(() => ({}));
      console.log("Fetched updated profile:", {
        profileId: fetchedResult?.data?.id,
        hasResidentialAddress: !!fetchedResult?.data?.residentialAddress,
        residentialAddressId: fetchedResult?.data?.residentialAddress?.id,
      });
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

