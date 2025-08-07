import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TutorDashboardClient from "@/components/TutorDashboardClient";

export default async function TutorDashboard() {
  const session = await auth();
  if (!session) return redirect("/login");

  return <TutorDashboardClient user={session.user} />;
};