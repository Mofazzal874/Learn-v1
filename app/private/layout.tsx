import { getSession } from "@/lib/getSession";
import { redirect } from "next/navigation";
import { ClientLayout } from "@/components/ClientLayout";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session?.user;
  if (!user) return redirect("/");

  return <ClientLayout>{children}</ClientLayout>;
} 