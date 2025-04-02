import type { Metadata } from "next";
import { Inter } from "next/font/google";
// import Navbar from "@/components/auth/Navbar";
import Layout from "@/components/layout";
import Footer from '@/components/Footer';
import { Providers } from './providers';

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Learn - AI-Powered Learning Platform",
  description: "Personalized learning paths adapted to your pace and goals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Layout>
            {children}
            <Footer />
          </Layout>
        </Providers>
      </body>
    </html>
  );
}