import React from 'react';
import { getSession } from "@/lib/getSession";
import { ClientLayout } from './ClientLayout';
import Navbar from './auth/Navbar';

const Layout: React.FC<{ children: React.ReactNode }> = async ({ children }) => {
  const session = await getSession();
  const user = session?.user;

  // If no user is logged in, only show the navbar
  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    );
  }

  // For logged-in users, show both navbar and sidebar
  return <ClientLayout navbar={<Navbar />}>{children}</ClientLayout>;
};

export default Layout;