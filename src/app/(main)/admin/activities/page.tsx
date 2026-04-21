import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ActivitiesClient from "./ActivitiesClient";

export default async function AdminActivitiesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="w-full h-full bg-[#f8f9fa] min-h-[90vh]">
      <ActivitiesClient />
    </div>
  );
}
