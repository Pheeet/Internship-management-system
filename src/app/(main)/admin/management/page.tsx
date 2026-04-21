import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentAdmins } from "@/actions/user";
import AdminManagementClient from "./AdminManagementClient";

export const dynamic = "force-dynamic";

export default async function AdminManagementPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const adminsRes = await getCurrentAdmins();
  const initialAdmins = (adminsRes.data ?? []) as any[];

  return (
    <AdminManagementClient
      currentUserId={user.id}
      initialAdmins={initialAdmins}
    />
  );
}
