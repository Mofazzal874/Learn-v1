import { getSession } from "@/lib/getSession";
import { ClientLayout } from "./ClientLayout";
import Navbar from "./auth/Navbar";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session?.user;

  // If no user is logged in, show the public navbar and content
  if (!user) {
    return (
      <>
        <Navbar />
        <div className="">
          {children}
        </div>
      </>
    );
  }

  // For logged-in users on private routes, show the client layout
  return <ClientLayout>{children}</ClientLayout>;
}