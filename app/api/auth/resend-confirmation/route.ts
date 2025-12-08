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
      console.error("Strapi URL is not configured");
      // Still return success to prevent revealing system state
      return NextResponse.json(
        {
          success: true,
          message: "If an account with that email exists and is not confirmed, a confirmation email has been sent.",
        },
        { status: 200 }
      );
    }

    try {
      // Call Strapi's built-in resend email confirmation endpoint
      // Note: Strapi uses /api/auth/send-email-confirmation endpoint
      const response = await fetch(`${strapiUrl}/api/auth/send-email-confirmation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await response.json().catch(() => ({})) as StrapiResponse;

      // Log for debugging (server-side only)
      console.log("Strapi resend confirmation response:", {
        status: response.status,
        ok: response.ok,
        result,
      });

      // Strapi's send-email-confirmation endpoint returns 200 even if email doesn't exist
      // or is already confirmed (security best practice to prevent email enumeration)
      // We'll always return success to the user
      return NextResponse.json(
        {
          success: true,
          message: "If an account with that email exists and is not confirmed, a confirmation email has been sent.",
        },
        { status: 200 }
      );
    } catch (fetchError) {
      console.error("Error calling Strapi resend confirmation endpoint:", fetchError);
      // Still return success to prevent email enumeration
      return NextResponse.json(
        {
          success: true,
          message: "If an account with that email exists and is not confirmed, a confirmation email has been sent.",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Resend confirmation error:", error);
    
    // Log the error for debugging, but always return success to prevent email enumeration
    // This way we don't reveal whether an email exists in the system
    return NextResponse.json(
      {
        success: true,
        message: "If an account with that email exists and is not confirmed, a confirmation email has been sent.",
      },
      { status: 200 }
    );
  }
}

