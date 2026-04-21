"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/** Search users by email or name (case-insensitive). Returns up to 10 results. */
export async function searchUsers(query: string) {
  try {
    const actor = await getCurrentUser();
    if (!actor || actor.role !== "admin") throw new Error("Unauthorized");

    if (!query || query.trim().length < 1) return { success: true, data: [] };

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
          {
            profile: {
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
              ],
            },
          },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        profile: {
          select: { firstName: true, lastName: true, profilePictureUrl: true },
        },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("[searchUsers] Error:", error);
    return { success: false, error: "ค้นหาผู้ใช้ไม่สำเร็จ", data: [] };
  }
}

/** Update a user's role. Admin only. Cannot change own role. */
export async function updateUserRole(userId: string, newRole: "ADMIN" | "STUDENT") {
  try {
    const actor = await getCurrentUser();
    if (!actor || actor.role !== "admin") throw new Error("Unauthorized");
    if (actor.id === userId) throw new Error("Cannot change your own role");

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: { id: true, email: true, name: true, role: true },
    });

    await prisma.activityLog.create({
      data: {
        action: newRole === "ADMIN" ? "ASSIGN_ADMIN" : "REVOKE_ADMIN",
        actorName: actor.name || actor.email,
        actorRole: actor.role,
        targetName: updated.name || updated.email,
        details: `เปลี่ยน role ของ ${updated.email} เป็น ${newRole}`,
      },
    });

    revalidatePath("/admin/management");
    revalidatePath("/admin/activities");
    revalidatePath("/admin");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("[updateUserRole] Error:", error);
    return { success: false, error: error.message || "เปลี่ยน role ไม่สำเร็จ" };
  }
}

/** Fetch all users with ADMIN role. */
export async function getCurrentAdmins() {
  try {
    const actor = await getCurrentUser();
    if (!actor || actor.role !== "admin") throw new Error("Unauthorized");

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        profile: {
          select: { firstName: true, lastName: true, profilePictureUrl: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, data: admins };
  } catch (error) {
    console.error("[getCurrentAdmins] Error:", error);
    return { success: false, error: "ดึงข้อมูล admin ไม่สำเร็จ", data: [] };
  }
}
