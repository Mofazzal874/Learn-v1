import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import CTASection from '@/components/CTASection';
import { getSession } from "@/lib/getSession";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  
  if (session?.user) {
    redirect("/private/dashboard");
  }
  return (
    <main className="bg-[#0a0a0a] [&>*]:p-0 [&>*]:m-0">
      {/* Hero Section with Spline */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* CTA Section */}
      <CTASection />
    </main>
  );
}