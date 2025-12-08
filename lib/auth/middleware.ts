import { NextRequest } from "next/server";

/**
 * Check if the user is authenticated
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  // Check session cookie
  const sessionCookie = request.cookies.get("alumni_session");
  
  if (!sessionCookie?.value) {
    return false;
  }
  
  try {
    const sessionData = JSON.parse(sessionCookie.value);
    return !!sessionData?.userId && !!sessionData?.email;
  } catch {
    return false;
  }
}

/**
 * Get session data from request (client-side compatible)
 */
export function getSessionFromRequest(request: NextRequest) {
  const sessionCookie = request.cookies.get("alumni_session");
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  try {
    return JSON.parse(sessionCookie.value) as {
      userId: string;
      email: string;
      firstName: string;
    };
  } catch {
    return null;
  }
}

