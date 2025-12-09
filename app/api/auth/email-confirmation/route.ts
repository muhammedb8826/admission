import { NextRequest, NextResponse } from "next/server";
import { getStrapiURL } from "@/lib/strapi/client";

type StrapiResponse = {
  jwt?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    confirmed: boolean;
  };
  message?: string;
  error?: {
    message?: string;
    status?: number;
    data?: Array<{
      messages?: Array<{
        message?: string;
      }>;
    }>;
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const confirmation = body?.confirmation as string | undefined;

    if (!confirmation) {
      return NextResponse.json(
        { error: "Confirmation code is required" },
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

    // Call Strapi's built-in email confirmation endpoint.
    // Strapi expects a GET with the confirmation code as a query param.
    const response = await fetch(
      `${strapiUrl}/api/auth/email-confirmation?confirmation=${encodeURIComponent(
        confirmation
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json().catch(() => ({})) as StrapiResponse;

    if (!response.ok) {
      let errorMessage = "Invalid or expired confirmation code. Please request a new confirmation email.";
      
      if (result?.error?.message) {
        errorMessage = result.error.message;
      } else if (result?.error?.data?.[0]?.messages?.[0]?.message) {
        errorMessage = result.error.data[0].messages[0].message;
      } else if (result?.message) {
        errorMessage = result.message;
      }

      console.error("Strapi email confirmation error:", {
        status: response.status,
        error: result,
      });

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 400 }
      );
    }

    // Email confirmed successfully
    return NextResponse.json(
      {
        success: true,
        message: "Email confirmed successfully! You can now login.",
        user: result.user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email confirmation error:", error);
    return NextResponse.json(
      { error: "An error occurred while confirming your email. Please try again." },
      { status: 500 }
    );
  }
}

