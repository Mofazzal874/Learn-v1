import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import { getSession } from "@/lib/getSession";
import { User } from "@/models/User";
import UserContextProvider from "@/components/UserContextProvider";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const userID = session?.user?.id;
  if (!userID) return redirect("/");

  await connectDB();
  const userDoc = await User.findById(userID).lean();
  const user = JSON.parse(JSON.stringify(userDoc));
  if (!user) return redirect("/");

  return (
    <UserContextProvider initialuser={user}>
      {children}
    </UserContextProvider>
  );
}
