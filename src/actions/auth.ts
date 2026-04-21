"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * Updates the display name for the currently logged-in user.
 * Specifically used for admins to customize their display name.
 */
export async function updateAdminName(newName: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name: newName },
    });

    revalidatePath("/"); // Revalidate all to update header/dropdown

    return { 
      success: true, 
      message: "Display name updated successfully",
      data: updatedUser 
    };
  } catch (error) {
    console.error("[updateAdminName] Error:", error);
    return { success: false, error: "Failed to update display name" };
  }
}
