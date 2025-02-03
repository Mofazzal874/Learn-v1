'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

// Lazy load the Spline component
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
  ssr: false
});

export default function HeroSection() {
  return (
    <section className="relative h-screen">
      {/* Spline Scene Container */}
      <div className="absolute inset-0">
        <Spline 
          scene="https://prod.spline.design/L9XQtcBkCJ3oqWv7/scene.splinecode"
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full bg-gradient-to-b from-black/50 via-black/30 to-black/80 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
            Learn Anything with AI
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-white/90 drop-shadow-md font-medium">
            Your personalized AI learning companion. Master any subject with interactive guidance and structured roadmaps.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/explore"
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-[0_8px_30px_rgb(59,130,246,0.3)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.5)] transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10">Start Learning</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link
              href="/register"
              className="group relative px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-xl font-semibold text-lg border border-white/20 hover:border-white/40 shadow-[0_8px_30px_rgba(255,255,255,0.1)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.2)] transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Sign Up Free</span>
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 