import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { strapiFetch } from "@/lib/strapi/client";
import type { StrapiCollectionResponse } from "@/lib/strapi/types";
import { createSession } from "@/lib/auth/session";

type StrapiRegistration = {
  id: number;
  firstName: string;
  fatherName: string;
  grandFatherName: string;
  phoneNumber: string;
  email: string;
  birthDate: string;
  gender?: number;
  nationality?: number;
  alumniCategory?: number;
  jobTitle: string;
  companyName: string;
  address: string;
  password: string;
  supportDescription: string;
};

type StrapiRegistrationsResponse = StrapiCollectionResponse<StrapiRegistration>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const email = body?.email as string | undefined;
    const password = body?.password as string | undefined;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Look up registration by email in Strapi
    const response = await strapiFetch<StrapiRegistrationsResponse>("almuni-registrations", {
      params: {
        filters: {
          email: {
            $eq: email,
          },
        },
        pagination: {
          page: 1,
          pageSize: 1,
        },
      },
    });

    const user = response.data?.[0];

    if (!user || !user.password) {
      // Do not reveal whether email exists
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    await createSession({
      userId: String(user.id),
      email: user.email,
      firstName: user.firstName,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          firstName: user.firstName,
          email: user.email,
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


