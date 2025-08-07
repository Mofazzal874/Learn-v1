import { getSession } from "@/lib/getSession";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/DashboardClient";

const Dashboard = async () => {
  const session = await getSession();
  const user = session?.user;
  if (!user) return redirect("/");

  return <DashboardClient user={user} />;
};

export default Dashboard;