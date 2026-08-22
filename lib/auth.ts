import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { get } from "./db";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "dev-only-change-me-aitts-session-secret");
const COOKIE = "aitts_session";

export type SessionUser = { id: number; name: string; email: string; role: "STUDENT" | "ADMIN" };

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function destroySession() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.id || !payload.role) return null;
    return { id: Number(payload.id), name: String(payload.name), email: String(payload.email), role: payload.role as SessionUser["role"] };
  } catch { return null; }
}

export async function requireUser(role?: SessionUser["role"]) {
  const session = await getSession();
  if (!session || (role && session.role !== role)) throw new Error("UNAUTHORIZED");
  return session;
}

export async function getUserByEmail(email: string) {
  return await get("SELECT id,name,email,password_hash,role FROM users WHERE lower(email)=lower($1)", [email]);
}
