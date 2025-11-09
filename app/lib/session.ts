import { cookies } from 'next/headers';

export interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id?: string;
}

const SESSION_COOKIE_NAME = 'session_id';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Create a new session with tokens
 * Stores session data in httpOnly cookie
 */
export async function createSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
}

/**
 * Get current session from cookie
 * Returns null if session doesn't exist or is invalid
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value) as SessionData;

    // Validate session structure
    if (
      !session.access_token ||
      !session.refresh_token ||
      !session.expires_at
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Update existing session with new data
 * Merges with existing session data
 */
export async function updateSession(
  updates: Partial<SessionData>
): Promise<SessionData | null> {
  const existingSession = await getSession();

  if (!existingSession) {
    return null;
  }

  const updatedSession: SessionData = {
    ...existingSession,
    ...updates,
  };

  await createSession(updatedSession);
  return updatedSession;
}

/**
 * Delete current session
 * Removes session cookie
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
