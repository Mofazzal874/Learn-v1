import { fetchAllUsers } from "@/action/user";
import { getSession } from "@/lib/getSession";
import { User } from "@/models/User";
import { redirect } from "next/navigation";

const Settings = async () => {
  const session = await getSession();
  const user = session?.user;
  if (!user) return redirect("/login");

  if (user?.role !== "admin") return redirect("/private/dashboard");

  const allUsers = await fetchAllUsers();

  return (
    <div>Settings page</div>
  );
};

export default Settings;