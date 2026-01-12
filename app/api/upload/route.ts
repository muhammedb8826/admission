import { NextRequest, NextResponse } from "next/server";
import { getStrapiURL } from "@/lib/strapi/client";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const strapiUrl = getStrapiURL();
    if (!strapiUrl) {
      return NextResponse.json(
        { error: "Strapi API is not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const userJwt = session.jwt;
    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
    const authToken = userJwt || apiToken;

    // Sanitize filename to avoid issues with special characters
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Read the file as a stream/buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Create FormData for Strapi upload
    const strapiFormData = new FormData();
    
    // Create a Blob and File from the buffer
    const fileBlob = new Blob([fileBuffer], { type: file.type });
    const fileToUpload = new File([fileBlob], sanitizedFileName, { 
      type: file.type
    });
    
    strapiFormData.append("files", fileToUpload);

    // Upload to Strapi - don't set Content-Type header, let fetch set it with boundary
    const headers: HeadersInit = {};
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    console.log("Uploading file to Strapi:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      strapiUrl: `${strapiUrl}/api/upload`,
    });

    let response;
    try {
      response = await fetch(`${strapiUrl}/api/upload`, {
        method: "POST",
        headers,
        body: strapiFormData,
      });
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      throw new Error(`Failed to connect to Strapi: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }

    let result;
    try {
      result = await response.json();
    } catch {
      // If JSON parsing fails, try to get text response
      const textResult = await response.text();
      console.error("Failed to parse JSON response:", textResult);
      result = {};
    }

    // Check if the response is ok OR if we got file data despite an error
    // Sometimes Strapi returns file data even if optimization fails
    const uploadedFile = Array.isArray(result) ? result[0] : result;
    const hasFileData = uploadedFile && (uploadedFile.id || uploadedFile.url);

    if (!response.ok && !hasFileData) {
      const errorMessage =
        result?.error?.message ||
        result?.message ||
        "Failed to upload file";

      console.error("Strapi upload error:", {
        status: response.status,
        error: result,
        hasFileData
      });

      // Check if this is the Windows file locking issue
      const isWindowsFileLockError = response.status === 500 && 
        (result?.error?.message?.includes('EBUSY') || 
         result?.error?.message?.includes('resource busy') ||
         result?.error?.message?.includes('locked'));

      const detailedError = isWindowsFileLockError
        ? "File upload failed due to Windows file locking issue in Strapi. This is a known issue with Strapi's image optimization on Windows. To fix this, you need to disable image optimization in Strapi's configuration. See the error details for more information."
        : errorMessage;

      return NextResponse.json(
        { 
          error: detailedError,
          details: result,
          suggestion: isWindowsFileLockError 
            ? "To fix this issue, disable image optimization in Strapi by adding the following to your Strapi config/plugins.js: module.exports = { upload: { config: { sizeLimit: 250 * 1024 * 1024, breakpoints: { xlarge: 1920, large: 1000, medium: 750, small: 500, xsmall: 64 } } } }; Or set IMAGE_OPTIMIZATION_ENABLED=false in your Strapi .env file if your version supports it."
            : undefined
        },
        { status: response.status || 500 }
      );
    }

    // If we have file data, return it even if there was an optimization error
    // The file is uploaded, just the optimization might have failed
    if (hasFileData) {
      console.log("File uploaded successfully:", {
        id: uploadedFile.id,
        url: uploadedFile.url,
        name: uploadedFile.name
      });

      return NextResponse.json(
        { 
          id: uploadedFile.id,
          url: uploadedFile.url,
          data: uploadedFile,
          warning: !response.ok ? "File uploaded but optimization may have failed" : undefined
        },
        { status: 200 }
      );
    }

    // Fallback - shouldn't reach here
    return NextResponse.json(
      { error: "Unexpected response from Strapi", details: result },
      { status: 500 }
    );
  } catch (error) {
    console.error("File upload error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file";

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? {
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        } : undefined
      },
      { status: 500 }
    );
  }
}
