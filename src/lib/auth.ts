"use server";

import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

export type UserRole = "student" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePictureUrl?: string | null;
}



const COOKIE_NAME = "session_user";

async function setSessionCookie(user: AuthUser) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify(user), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// ─── Login ─────────────────────────────────────────────────────────────────

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { profile: true },
    });

    if (!dbUser) {
      return { success: false, error: "ไม่พบบัญชีนี้ในระบบ" };
    }

    if (!dbUser.passwordHash) {
      return { success: false, error: "บัญชีนี้ยังไม่ได้ตั้งรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ" };
    }

    if (!verifyPassword(password, dbUser.passwordHash)) {
      return { success: false, error: "รหัสผ่านไม่ถูกต้อง" };
    }

    // Build display name: profile > db.name > email prefix
    let displayName = dbUser.name;
    if (!displayName && dbUser.profile) {
      displayName = `${dbUser.profile.title} ${dbUser.profile.firstName} ${dbUser.profile.lastName}`.trim();
    }
    if (!displayName) {
      displayName = dbUser.email.split("@")[0];
    }

    const role: UserRole = dbUser.role === "ADMIN" ? "admin" : "student";

    const sessionUser: AuthUser = {
      id: dbUser.id,
      name: displayName,
      email: dbUser.email,
      role,
      profilePictureUrl: dbUser.profile?.profilePictureUrl ?? null,
    };

    await setSessionCookie(sessionUser);
    return { success: true, user: sessionUser };
  } catch (err) {
    console.error("[loginWithCredentials] Error:", err);
    return { success: false, error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
  }
}

// ─── Get Current User ──────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();

  // Support both old cookie name (migration) and new one
  const raw =
    cookieStore.get(COOKIE_NAME)?.value ??
    cookieStore.get("mock_user")?.value;

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthUser;

    // Sync latest data from DB (role, name, avatar may have changed)
    const dbUser = await prisma.user.findUnique({
      where: { id: parsed.id },
      include: { profile: true },
    });

    if (!dbUser) return null;

    let displayName = dbUser.name;
    if (!displayName && dbUser.profile) {
      displayName = `${dbUser.profile.title} ${dbUser.profile.firstName} ${dbUser.profile.lastName}`.trim();
    }
    if (!displayName) displayName = parsed.name;

    const role: UserRole = dbUser.role === "ADMIN" ? "admin" : "student";

    let profilePictureUrl = dbUser.profile?.profilePictureUrl ?? null;
    // Prefix legacy paths
    if (profilePictureUrl?.startsWith("/api/files/")) {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/intern";
      profilePictureUrl = `${basePath}${profilePictureUrl}`;
    }

    return {
      id: dbUser.id,
      name: displayName || parsed.name,
      email: dbUser.email,
      role,
      profilePictureUrl,
    };
  } catch {
    return null;
  }
}

// ─── Logout ────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete("mock_user"); // clean up legacy cookie too
}

// ─── Legacy shim (used by some existing components) ────────────────────────

/** @deprecated Use loginWithCredentials instead */
export async function mockLogin(role: UserRole): Promise<AuthUser> {
  const email = role === "admin" ? "phet_admin@cmu.ac.th" : "phet_stu@cmu.ac.th";
  const res = await loginWithCredentials(email, "1234");
  if (res.success && res.user) return res.user;
  throw new Error("Legacy mockLogin failed — ensure seed has run");
}

/** @deprecated Use logout instead */
export async function mockLogout(): Promise<void> {
  return logout();
}
