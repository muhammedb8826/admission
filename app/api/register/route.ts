import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const STRAPI_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const firstName = formData.get("firstName") as string;
    const fatherName = formData.get("fatherName") as string;
    const grandFatherName = formData.get("grandFatherName") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const email = formData.get("email") as string;
    const birthDate = formData.get("birthDate") as string;
    const gender = formData.get("gender") as string;
    const nationality = formData.get("nationality") as string;
    const alumniCategory = formData.get("alumniCategory") as string;
    const jobTitle = formData.get("jobTitle") as string;
    const companyName = formData.get("companyName") as string;
    const address = formData.get("address") as string;
    const password = formData.get("password") as string;
    const supportDescription = formData.get("supportDescription") as string;
    const supportFile = formData.get("supportFile") as File | null;

    // Validate required fields
    if (
      !firstName ||
      !fatherName ||
      !grandFatherName ||
      !phoneNumber ||
      !email ||
      !birthDate ||
      !gender ||
      !nationality ||
      !alumniCategory ||
      !jobTitle ||
      !companyName ||
      !address ||
      !password ||
      !supportDescription
    ) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle file upload to Strapi if file exists
    let supportFileId: number | null = null;
    if (supportFile && supportFile.size > 0) {
      try {
        const fileFormData = new FormData();
        fileFormData.append("files", supportFile);

        const fileUploadResponse = await fetch(`${STRAPI_URL}/api/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${STRAPI_TOKEN}`,
          },
          body: fileFormData,
        });

        if (fileUploadResponse.ok) {
          const fileData = await fileUploadResponse.json();
          if (fileData && fileData.length > 0) {
            supportFileId = fileData[0].id;
          }
        } else {
          console.warn("File upload failed, continuing without file");
        }
      } catch (error) {
        console.warn("Error uploading file:", error);
        // Continue without file if upload fails
      }
    }

    // Validate relation IDs are valid integers
    const genderId = parseInt(gender);
    const nationalityId = parseInt(nationality);
    const alumniCategoryId = parseInt(alumniCategory);

    if (isNaN(genderId) || isNaN(nationalityId) || isNaN(alumniCategoryId)) {
      return NextResponse.json(
        { error: "Invalid selection for gender, nationality, or alumni category" },
        { status: 400 }
      );
    }

    // Prepare registration data for Strapi
    // IMPORTANT: The field names must match EXACTLY what's defined in Strapi Content-Type Builder
    // 
    // ERROR: "Invalid key gender" means the field name doesn't exist
    // 
    // To find the correct field names:
    // Method 1 (Recommended):
    // 1. Go to Strapi Admin → Content-Type Builder
    // 2. Click on "almuni-registration" collection type
    // 3. For each relation field (Gender, Nationality, Alumni Category):
    //    - Click on the field
    //    - Look at the "Name" field - this is the API identifier
    //    - Common possibilities: gender/genders, nationality/nationalities, alumniCategory/alumni_category
    //
    // Method 2:
    // Try creating an entry manually in Strapi Content Manager and check the Network tab
    // to see what field names it uses when saving
    const registrationData = {
      data: {
        firstName,
        fatherName,
        grandFatherName,
        phoneNumber,
        email,
        birthDate,
        // Relation fields - these names MUST match Strapi exactly
        // If you get "Invalid key" errors, check Content-Type Builder for the actual field names
        gender: genderId,        // ❌ Currently failing - check actual field name in Strapi
        nationality: nationalityId,
        alumniCategory: alumniCategoryId,
        jobTitle,
        companyName,
        address,
        password: hashedPassword,
        supportDescription,
        ...(supportFileId && { supportFile: supportFileId }),
      },
    };

    // Submit to Strapi
    // Note: Collection name in Strapi is "almuni-registration" (as shown in logs)
    console.log("Sending to Strapi:", JSON.stringify(registrationData, null, 2));
    
    const strapiResponse = await fetch(`${STRAPI_URL}/api/almuni-registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify(registrationData),
    });

    if (!strapiResponse.ok) {
      const errorData = await strapiResponse.json().catch(() => ({}));
      console.error("Strapi API error:", {
        status: strapiResponse.status,
        statusText: strapiResponse.statusText,
        error: errorData,
      });
      
      // Return more detailed error message
      const errorMessage =
        errorData?.error?.message ||
        errorData?.message ||
        `Registration failed (${strapiResponse.status}): ${strapiResponse.statusText}`;
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorData,
        },
        { status: strapiResponse.status }
      );
    }

    const result = await strapiResponse.json();

    return NextResponse.json(
      {
        success: true,
        message: "Registration submitted successfully!",
        data: result,
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

