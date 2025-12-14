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

    // Get the JWT token from the session
    // Note: You may need to store the JWT token in the session during login
    // For now, we'll use the API token if available
    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;

    // Associate the profile with the logged-in user
    // Add user email to the data if not already present
    const profileData = {
      ...body.data,
      // Add user email for filtering/association
      // Adjust based on your Strapi schema - you might have a user relation instead
      email: body.data.email || session.email,
    };

    const response = await fetch(`${strapiUrl}/api/student-profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
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
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      );
    }

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
    const { searchParams } = new URL(request.url);
    const populate = searchParams.get("populate") || "*";

    // Filter by the logged-in user's email
    // Using Strapi filter syntax - adjust based on your schema
    // If student-profiles has a user relation, you might need: filters[user][email][$eq]
    // For now, we'll fetch all and filter server-side for security
    const response = await fetch(
      `${strapiUrl}/api/student-profiles?populate=${populate}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
        },
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        result?.error?.message ||
        result?.message ||
        "Failed to fetch student profiles";
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      );
    }

    // Filter results server-side to only return the logged-in user's profile
    // This ensures security even if Strapi filtering doesn't work as expected
    let filteredData = null;
    
    type ProfileData = {
      email?: string;
      userId?: string;
      user?: {
        email?: string;
        id?: number;
      };
      [key: string]: unknown;
    };
    
    if (result?.data) {
      if (Array.isArray(result.data)) {
        // Find profile matching the logged-in user's email
        // Adjust this logic based on your Strapi schema
        filteredData = result.data.find((profile: ProfileData) => {
          // Check if profile has email field matching session email
          if (profile.email === session.email) return true;
          // Check if profile has user relation with matching email
          if (profile.user?.email === session.email) return true;
          // Check if profile has userId matching session userId
          if (profile.userId === session.userId) return true;
          if (profile.user?.id === Number(session.userId)) return true;
          return false;
        }) || null;
      } else if (result.data) {
        // Single object - check if it belongs to the user
        const profile = result.data as ProfileData;
        if (
          profile.email === session.email ||
          profile.user?.email === session.email ||
          profile.userId === session.userId ||
          profile.user?.id === Number(session.userId)
        ) {
          filteredData = profile;
        }
      }
    }

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

