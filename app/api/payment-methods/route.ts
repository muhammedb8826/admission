import { NextResponse } from "next/server";
import { getStrapiURL } from "@/lib/strapi/client";
import { getSession } from "@/lib/auth/session";
import { fetchActivePaymentMethods } from "@/lib/strapi/payments";

/**
 * Active payment methods (BANK / TELEBIRR) for application fee instructions.
 */
export async function GET() {
  try {
    const strapiUrl = getStrapiURL();
    if (!strapiUrl) {
      return NextResponse.json(
        { error: "Strapi API is not configured" },
        { status: 500 }
      );
    }

    const session = await getSession();
    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
    const userJwt = (session as { jwt?: string } | null)?.jwt;
    const token = apiToken || userJwt;

    const list = await fetchActivePaymentMethods(strapiUrl, token);
    return NextResponse.json({ data: list, meta: {} }, { status: 200 });
  } catch (error) {
    console.error("Payment methods fetch error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch payment methods";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
