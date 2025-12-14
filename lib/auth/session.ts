import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "alumni_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionData = {
  userId: string;
  email: string;
  firstName: string;
  jwt?: string; // Store JWT token for authenticated Strapi requests
};

export async function createSession(data: SessionData) {
  const cookieStore = await cookies();
  
  // In a production app, you'd want to sign/encrypt this token
  // For now, we'll use a simple JSON-encoded session
  const sessionValue = JSON.stringify(data);
  
  cookieStore.set(SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  try {
    const sessionData = JSON.parse(sessionCookie.value) as SessionData;
    return sessionData;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

