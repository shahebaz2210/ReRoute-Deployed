import { MemberRole } from "@dispatchx/contracts";
import { randomBytes, createHmac } from "node:crypto";
import { cookies } from "next/headers";

export interface SessionData {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  role: MemberRole;
  organizationId: string;
  createdAt: number; // absolute start
  lastActiveAt: number; // idle timer
}

const COOKIE_NAME = "dispatchx_session";
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes (Task 68)
const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours (Task 68)
const SECRET = process.env.AUTH_SECRET || "default-secret-key-32-characters-long!!";

// In-memory session store (backed by secure HMAC signed tokens)
const sessions = new Map<string, SessionData>();

export function signToken(data: SessionData): string {
  const json = JSON.stringify(data);
  const base64 = Buffer.from(json).toString("base64url");
  const signature = createHmac("sha256", SECRET).update(base64).digest("base64url");
  return `${base64}.${signature}`;
}

export function verifyToken(token: string): SessionData | null {
  try {
    const [base64, signature] = token.split(".");
    if (!base64 || !signature) return null;

    const expectedSig = createHmac("sha256", SECRET).update(base64).digest("base64url");
    if (signature !== expectedSig) return null;

    const json = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(json) as SessionData;
  } catch {
    return null;
  }
}

export async function createSession(
  user: { id: string; email: string; name: string; role: MemberRole; organizationId: string }
): Promise<SessionData> {
  const now = Date.now();
  const session: SessionData = {
    sessionId: randomBytes(24).toString("hex"),
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    createdAt: now,
    lastActiveAt: now,
  };

  sessions.set(session.sessionId, session);

  const token = signToken(session);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60, // 8 hours max
  });

  return session;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = verifyToken(token);
  if (!session) return null;

  const now = Date.now();

  // Check absolute expiry (8 hours)
  if (now - session.createdAt > ABSOLUTE_TIMEOUT_MS) {
    await clearSession();
    return null;
  }

  // Check idle expiry (30 mins)
  if (now - session.lastActiveAt > IDLE_TIMEOUT_MS) {
    await clearSession();
    return null;
  }

  // Session rotation / touch on activity
  session.lastActiveAt = now;
  const rotatedToken = signToken(session);
  cookieStore.set(COOKIE_NAME, rotatedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });

  return session;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
