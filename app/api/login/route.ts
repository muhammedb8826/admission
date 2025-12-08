import { NextRequest, NextResponse } from "next/server";
import { getStrapiURL } from "@/lib/strapi/client";
import { createSession } from "@/lib/auth/session";

type StrapiAuthResponse = {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    [key: string]: unknown;
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const identifier = body?.identifier as string | undefined;
    const password = body?.password as string | undefined;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username/email and password are required" },
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

    // Call Strapi authentication endpoint
    const response = await fetch(`${strapiUrl}/api/auth/local`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: identifier.trim(), // Strapi uses 'identifier' which can be email or username
        password: password,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Handle Strapi authentication errors
      const errorMessage =
        result?.error?.message ||
        result?.message ||
        "Invalid username/email or password";
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 401 }
      );
    }

    const authData = result as StrapiAuthResponse;

    // Create session with user data from Strapi
    await createSession({
      userId: String(authData.user.id),
      email: authData.user.email,
      firstName: authData.user.firstName || authData.user.username || "",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: authData.user.id,
          firstName: authData.user.firstName || authData.user.username,
          email: authData.user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}


