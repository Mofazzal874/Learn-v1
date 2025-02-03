import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="bg-[#0a0a0a] mt-40 mb-40 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-indigo-600/10 to-purple-600/10 blur-3xl"></div>
      
      <div className="relative max-w-4xl mx-auto text-center px-6 py-24 sm:px-8 lg:px-16">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-10">
          <span className="block mb-4">Ready to start learning?</span>
          <span className="block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Create your personalized roadmap today.
          </span>
        </h2>
        <p className="mt-10 text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto mb-16">
          Join thousands of learners who are achieving their goals with AI-guided learning.
        </p>
        <Link 
          href="/register" 
          className="inline-flex items-center justify-center px-12 py-6 text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform"
        >
          Get started for free
        </Link>
      </div>
    </section>
  );
} 