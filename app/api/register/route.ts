import { NextRequest, NextResponse } from "next/server";
import { getStrapiURL } from "@/lib/strapi/client";

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

    const username = body?.username as string | undefined;
    const email = body?.email as string | undefined;
    const password = body?.password as string | undefined;

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate username length
    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
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

    // Prepare registration data for Strapi auth/local/register
    // Strapi requires: username, email, password
    const registrationData = {
      username: username,
      email: email,
      password: password,
    };

    // Call Strapi registration endpoint
    const response = await fetch(`${strapiUrl}/api/auth/local/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registrationData),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {

      let errorMessage = "Registration failed. Please try again.";
      
      if (result?.error?.error?.message) {
        // Nested error structure: { error: { error: { message: "..." } } }
        errorMessage = result.error.error.message;
      } else if (result?.error?.message) {
        errorMessage = result.error.message;
      } else if (result?.error?.data?.[0]?.messages?.[0]?.message) {
        errorMessage = result.error.data[0].messages[0].message;
      } else if (result?.message) {
        errorMessage = result.message;
      } else if (typeof result?.error === "string") {
        errorMessage = result.error;
      }
      
      console.error("Strapi registration error:", {
        status: response.status,
        error: result,
        extractedMessage: errorMessage,
      });
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: result,
        },
        { status: response.status || 400 }
      );
    }

    const authData = result as StrapiAuthResponse;

    // Don't create session - user needs to login after registration
    return NextResponse.json(
      {
        success: true,
        message: "Registration successful! Please login to continue.",
        user: {
          id: authData.user.id,
          username: authData.user.username,
          email: authData.user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}

