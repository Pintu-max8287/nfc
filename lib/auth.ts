/**
 * lib/auth.ts
 * JWT authentication helpers using `jose` + `bcryptjs`.
 * Cookies: HttpOnly, Secure, SameSite=Lax, 7-day expiry.
 */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole =
  | "SUPER_ADMIN"
  | "RESTAURANT_ADMIN"
  | "KITCHEN_STAFF"
  | "WAITER";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  restaurantId: string | null;
  restaurantSlug: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COOKIE_NAME = "dineflow_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

// ─── Token Sign / Verify ──────────────────────────────────────────────────────

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ─── Cookie Helpers ───────────────────────────────────────────────────────────

export async function setSessionCookie(
  response: NextResponse,
  payload: SessionPayload
): Promise<NextResponse> {
  const token = await signToken(payload);
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

// ─── Session Readers ──────────────────────────────────────────────────────────

/** Read session from Next.js Server Component (uses next/headers cookies). */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Read session from an incoming NextRequest (middleware / Route Handler). */
export async function getSessionFromRequest(
  req: NextRequest
): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ─── Auth Guards (Server Components) ─────────────────────────────────────────

/**
 * Requires SUPER_ADMIN role. Throws redirect if not satisfied.
 * Usage: `const session = await requireSuperAdmin()` inside a Server Component.
 */
export async function requireSuperAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    throw new Error("UNAUTHORIZED_SUPER_ADMIN");
  }
  return session;
}

/**
 * Requires the user to belong to `slug` with one of `allowedRoles`.
 * SUPER_ADMIN is always allowed (impersonation/preview access).
 */
export async function requireRestaurantAccess(
  slug: string,
  allowedRoles: UserRole[]
): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (session.role === "SUPER_ADMIN") return session; // super-admin bypass
  if (
    session.restaurantSlug !== slug ||
    !allowedRoles.includes(session.role)
  ) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
