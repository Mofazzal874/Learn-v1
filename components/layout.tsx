import { getSession } from "@/lib/getSession";
import { ClientLayout } from "./ClientLayout";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session?.user;

  // For unauthorized users (public pages)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  // For authorized users (private pages)
  return <ClientLayout>{children}</ClientLayout>;
}