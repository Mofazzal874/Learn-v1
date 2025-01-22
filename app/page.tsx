import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import CTASection from '@/components/CTASection';

export default function Home() {
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