import { cookies } from "next/headers";
import { createHash } from "crypto";
import { ADMIN_PASSWORD } from "./config";

const SESSION_COOKIE = "hajessi_admin_session";
const SESSION_SECRET = "hajessi-session-v1";

function createSessionToken(): string {
  return createHash("sha256")
    .update(`${ADMIN_PASSWORD}:${SESSION_SECRET}`)
    .digest("hex");
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  return password === ADMIN_PASSWORD;
}

export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token === createSessionToken();
}
