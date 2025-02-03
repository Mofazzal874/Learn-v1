export default function FeaturesSection() {
  return (
    <section className="bg-[#0a0a0a] mt-40 mb-40">
      <div className="max-w-7xl mx-auto px-6 py-24 sm:px-8 lg:px-16">
        <h2 className="text-5xl font-bold text-center text-white mb-32">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {/* AI-Powered Learning */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-transparent rounded-3xl blur-xl group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative bg-[#1a1a1a]/50 px-8 py-14 rounded-3xl h-full backdrop-blur-sm border border-white/5 hover:border-blue-500/20 transition-colors duration-300">
              <h3 className="text-3xl font-bold text-blue-400 mb-6">
                AI-Powered Learning
              </h3>
              <p className="text-xl text-gray-300 leading-relaxed">
                Personalized learning paths adapted to your pace and goals
              </p>
            </div>
          </div>

          {/* Interactive Guidance */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-transparent rounded-3xl blur-xl group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative bg-[#1a1a1a]/50 px-8 py-14 rounded-3xl h-full backdrop-blur-sm border border-white/5 hover:border-indigo-500/20 transition-colors duration-300">
              <h3 className="text-3xl font-bold text-indigo-400 mb-6">
                Interactive Guidance
              </h3>
              <p className="text-xl text-gray-300 leading-relaxed">
                Real-time feedback and support throughout your journey
              </p>
            </div>
          </div>

          {/* Structured Roadmaps */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 to-transparent rounded-3xl blur-xl group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative bg-[#1a1a1a]/50 px-8 py-14 rounded-3xl h-full backdrop-blur-sm border border-white/5 hover:border-purple-500/20 transition-colors duration-300">
              <h3 className="text-3xl font-bold text-purple-400 mb-6">
                Structured Roadmaps
              </h3>
              <p className="text-xl text-gray-300 leading-relaxed">
                Clear learning paths to achieve your goals effectively
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 