import { NextRequest, NextResponse } from "next/server";
import { getStrapiURL } from "@/lib/strapi/client";

type StrapiResponse = {
  ok?: boolean;
  message?: string;
  error?: {
    message?: string;
    status?: number;
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = body?.email as string | undefined;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
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

    const strapiUrl = getStrapiURL();
    if (!strapiUrl) {
      return NextResponse.json(
        { error: "Strapi API is not configured" },
        { status: 500 }
      );
    }

    // Call Strapi's built-in forgot password endpoint
    // This sends an email with a reset code to the user
    const response = await fetch(`${strapiUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim() }),
    });

    const result = await response.json().catch(() => ({})) as StrapiResponse;

    // Strapi's forgot-password endpoint returns 200 even if email doesn't exist
    // This is a security best practice to prevent email enumeration
    // We'll always return success to the user
    return NextResponse.json(
      {
        success: true,
        message: "If an account exists with that email, a password reset code has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    // Always return success to prevent email enumeration (security best practice)
    return NextResponse.json(
      {
        success: true,
        message: "If an account exists with that email, a password reset code has been sent.",
      },
      { status: 200 }
    );
  }
}

