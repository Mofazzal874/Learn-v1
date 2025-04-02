import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Code, Brain, ChartBar, Atom, Globe, Database, Shield, Star, Layout, LineChart, Rocket, Server, Smartphone } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/getSession";
import { SearchBar } from "@/components/SearchBar";

type CategoryColor = 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'yellow' | 'red';

interface Category {
  title: string;
  icon: any; // Using any for Lucide icons
  description: string;
  color: CategoryColor;
  courses: number;
}

const colorMap: Record<CategoryColor, string> = {
  blue: "border-blue-500/20 hover:border-blue-500/40 bg-blue-500/10 text-blue-400",
  purple: "border-purple-500/20 hover:border-purple-500/40 bg-purple-500/10 text-purple-400",
  pink: "border-pink-500/20 hover:border-pink-500/40 bg-pink-500/10 text-pink-400",
  green: "border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  orange: "border-orange-500/20 hover:border-orange-500/40 bg-orange-500/10 text-orange-400",
  yellow: "border-amber-500/20 hover:border-amber-500/40 bg-amber-500/10 text-amber-400",
  red: "border-red-500/20 hover:border-red-500/40 bg-red-500/10 text-red-400"
};

const categories: Category[] = [
  {
    title: "Programming",
    icon: Code,
    description: "Learn programming languages and software development",
    color: "blue",
    courses: 42
  },
  {
    title: "Data Science",
    icon: ChartBar,
    description: "Master data analysis and machine learning",
    color: "purple",
    courses: 35
  },
  {
    title: "AI & ML",
    icon: Brain,
    description: "Explore artificial intelligence and machine learning",
    color: "pink",
    courses: 28
  },
  {
    title: "Physics",
    icon: Atom,
    description: "Understand the fundamental laws of the universe",
    color: "green",
    courses: 24
  },
  {
    title: "Languages",
    icon: Globe,
    description: "Learn new languages and cultures",
    color: "orange",
    courses: 31
  },
  {
    title: "Database",
    icon: Database,
    description: "Master database design and management",
    color: "yellow",
    courses: 19
  },
  {
    title: "Cybersecurity",
    icon: Shield,
    description: "Learn about network security and ethical hacking",
    color: "red",
    courses: 23
  }
];

const featuredCourses = [
  {
    title: "Python Programming Masterclass: From Beginner to Advanced with Real-World Projects",
    category: "Programming",
    level: "Beginner",
    students: "12,345",
    duration: "20 hours",
    image: "/python-course.jpg"
  },
  {
    title: "Machine Learning Fundamentals: Complete Guide to Building AI Models",
    category: "AI & ML",
    level: "Intermediate",
    students: "8,721",
    duration: "25 hours",
    image: "/ml-course.jpg"
  },
  {
    title: "Web Development Bootcamp: Full Stack Mastery with Modern Technologies",
    category: "Programming",
    level: "Beginner",
    students: "15,678",
    duration: "30 hours",
    image: "/web-dev-course.jpg"
  },
  {
    title: "Data Science with R: Statistical Analysis and Visualization",
    category: "Data Science",
    level: "Intermediate",
    students: "6,543",
    duration: "22 hours",
    image: "/data-science-course.jpg"
  }
];

const popularCourses = [
  {
    title: "JavaScript Complete Guide: From Zero to Expert",
    category: "Programming",
    level: "All Levels",
    students: "25,789",
    duration: "28 hours",
    rating: 4.9,
    image: "/javascript-course.jpg"
  },
  {
    title: "AWS Cloud Practitioner Certification",
    category: "Cloud Computing",
    level: "Beginner",
    students: "18,432",
    duration: "15 hours",
    rating: 4.8,
    image: "/aws-course.jpg"
  },
  {
    title: "UI/UX Design Fundamentals",
    category: "Design",
    level: "Intermediate",
    students: "12,654",
    duration: "18 hours",
    rating: 4.7,
    image: "/design-course.jpg"
  },
  {
    title: "React.js Advanced Patterns",
    category: "Programming",
    level: "Advanced",
    students: "9,876",
    duration: "20 hours",
    rating: 4.9,
    image: "/react-course.jpg"
  }
];

interface Course {
  title: string;
  category: string;
  level: string;
  students: string;
  duration: string;
  image: string;
  rating?: number;
}

function CourseCard({ course, showRating = false }: { course: Course; showRating?: boolean }) {
  return (
    <Card className="bg-[#141414] border-gray-800 shadow-xl overflow-hidden group flex flex-col">
      <div className="aspect-video w-full bg-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
        <BookOpen className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-white/30" />
      </div>
      <CardContent className="p-6 flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
            {course.category}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
            {course.level}
          </span>
        </div>
        <h3 className="text-lg font-semibold mb-4 text-slate-50 group-hover:text-blue-400 transition-colors line-clamp-2">
          {course.title}
        </h3>
        <div className="mt-auto">
          {showRating && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm text-yellow-400">{course.rating}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{course.students} students</span>
            <span>{course.duration}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/explore/category/${category.title.toLowerCase()}`}>
      <Card className={`bg-[#141414] border ${colorMap[category.color]} transition-colors h-full hover:scale-[1.02] transition-transform duration-200`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${category.color}`}>
              <category.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{category.title}</h3>
              <p className="text-sm text-gray-400">{category.courses} courses</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm">{category.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function ExplorePage({
  searchParams
}: {
  searchParams: { q?: string }
}) {
  const session = await getSession();
  const isPrivateRoute = !!session?.user;
  const searchQuery = searchParams.q?.toLowerCase();

  // Filter courses based on search query
  const filteredFeaturedCourses = searchQuery
    ? featuredCourses.filter(course =>
        course.title.toLowerCase().includes(searchQuery) ||
        course.category.toLowerCase().includes(searchQuery) ||
        course.level.toLowerCase().includes(searchQuery)
      )
    : featuredCourses;

  const filteredCategories = searchQuery
    ? categories.filter(category =>
        category.title.toLowerCase().includes(searchQuery) ||
        category.description.toLowerCase().includes(searchQuery)
      )
    : categories;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Search Bar for Private Routes */}
      {isPrivateRoute && (
        <div className="fixed top-4 right-8 z-50 w-96">
          <SearchBar variant="standalone" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto mb-16">
          <h1 className="text-4xl font-bold mb-4">Explore Courses</h1>
          <p className="text-gray-400 text-lg">Discover new skills and expand your knowledge</p>
        </div>

        {searchQuery ? (
          <>
            {/* Categories Section */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8">Browse Categories</h2>
              {filteredCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredCategories.map((category, index) => (
                    <CategoryCard key={index} category={category} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No categories found matching your search.</p>
                </div>
              )}
            </div>

            {/* Featured Courses */}
            <div>
              <h2 className="text-3xl font-bold mb-8">Featured Courses</h2>
              {filteredFeaturedCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFeaturedCourses.map((course, index) => (
                    <CourseCard key={index} course={course} showRating />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No courses found matching your search.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Categories Section */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8">Browse Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((category, index) => (
                  <CategoryCard key={index} category={category} />
                ))}
              </div>
            </div>

            {/* Featured Courses */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8">Featured Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredCourses.map((course, index) => (
                  <CourseCard key={index} course={course} showRating />
                ))}
              </div>
            </div>

            {/* Popular Courses */}
            <div>
              <h2 className="text-3xl font-bold mb-8">Popular Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularCourses.map((course, index) => (
                  <CourseCard key={index} course={course} showRating />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 