import { NextRequest, NextResponse } from "next/server";
import { strapiFetch } from "@/lib/strapi/client";

type StrapiResponse = {
  message: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const token = body?.token as string | undefined;
    const password = body?.password as string | undefined;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Call Strapi custom endpoint to reset password
    try {
      const response = await strapiFetch<StrapiResponse>(
        "almuni-registrations/reset-password",
        {
          method: "POST",
          body: JSON.stringify({ token, password }),
        }
      );

      // Check if response has data (endpoint exists and worked)
      if (response && 'message' in response) {
        return NextResponse.json(
          {
            success: true,
            message: response.message || "Password has been reset successfully",
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
        return NextResponse.json(
          { error: "Password reset functionality is not configured. Please contact support." },
          { status: 503 }
        );
      }
      
      // For other errors (like invalid token), return appropriate message
      if (errorMessage.includes("400") || errorMessage.includes("Invalid")) {
        return NextResponse.json(
          { error: "Invalid or expired reset token. Please request a new one." },
          { status: 400 }
        );
      }
      
      throw strapiError;
    }
  } catch (error) {
    console.error("Reset password confirm error:", error);
    return NextResponse.json(
      { error: "Invalid or expired reset token. Please request a new one." },
      { status: 400 }
    );
  }
}

