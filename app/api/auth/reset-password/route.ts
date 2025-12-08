import { NextRequest, NextResponse } from "next/server";
import { strapiFetch } from "@/lib/strapi/client";

type StrapiResponse = {
  message: string;
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

    // Call Strapi custom endpoint for password reset request
    try {
      const response = await strapiFetch<StrapiResponse>(
        "almuni-registrations/request-password-reset",
        {
          method: "POST",
          body: JSON.stringify({ email }),
        }
      );

      // Check if response has data (endpoint exists and worked)
      if (response && 'message' in response) {
        return NextResponse.json(
          {
            success: true,
            message: response.message || "If an account exists with that email, a password reset link has been sent.",
          },
          { status: 200 }
        );
      }

      // If response is empty, endpoint might not exist
      throw new Error("Password reset endpoint not configured");
    } catch (strapiError: unknown) {
      // Check if it's a 405 or 404 error (endpoint doesn't exist)
      const errorMessage = strapiError instanceof Error ? strapiError.message : String(strapiError);
      if (errorMessage.includes("405") || errorMessage.includes("404")) {
        console.error("Strapi password reset endpoint not found. Please add the custom routes in Strapi.");
        // Still return success to user (security best practice - don't reveal if email exists)
        return NextResponse.json(
          {
            success: true,
            message: "If an account exists with that email, a password reset link has been sent.",
          },
          { status: 200 }
        );
      }
      throw strapiError;
    }
  } catch (error) {
    console.error("Reset password error:", error);
    // Always return success to prevent email enumeration
    return NextResponse.json(
      {
        success: true,
        message: "If an account exists with that email, a password reset link has been sent.",
      },
      { status: 200 }
    );
  }
}

