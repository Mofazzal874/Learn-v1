import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle2, Clock, GraduationCap, BookmarkIcon } from "lucide-react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  category: string;
  progress: number;
  lastAccessed: string;
  duration: string;
  completed?: boolean;
  certificateId?: string;
  completedDate?: string;
}

const inProgressCourses: Course[] = [
  {
    id: "1",
    title: "Python Programming Masterclass",
    category: "Programming",
    progress: 65,
    lastAccessed: "2 days ago",
    duration: "20 hours"
  },
  {
    id: "2",
    title: "Machine Learning Fundamentals",
    category: "AI & ML",
    progress: 30,
    lastAccessed: "1 week ago",
    duration: "25 hours"
  }
];

const completedCourses: Course[] = [
  {
    id: "3",
    title: "Web Development Bootcamp",
    category: "Programming",
    progress: 100,
    lastAccessed: "1 month ago",
    duration: "30 hours",
    completed: true,
    certificateId: "CERT-2024-001",
    completedDate: "March 15, 2024"
  }
];

const savedCourses: Course[] = [
  {
    id: "4",
    title: "AWS Cloud Practitioner",
    category: "Cloud Computing",
    progress: 0,
    lastAccessed: "Not started",
    duration: "15 hours"
  },
  {
    id: "5",
    title: "UI/UX Design Fundamentals",
    category: "Design",
    progress: 0,
    lastAccessed: "Not started",
    duration: "18 hours"
  }
];

function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="bg-[#141414] border-gray-800 shadow-xl overflow-hidden group hover:border-blue-500/40 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
            {course.category}
          </span>
          {course.completed && (
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </span>
          )}
        </div>
        <Link href={`/course/${course.id}`}>
          <h3 className="text-lg font-semibold mb-4 text-white group-hover:text-blue-400 transition-colors line-clamp-2">
            {course.title}
          </h3>
        </Link>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span>{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{course.lastAccessed}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{course.duration}</span>
            </div>
          </div>
          {course.completed && course.certificateId && (
            <div className="pt-2 border-t border-gray-800">
              <Link 
                href={`/certificate/${course.certificateId}`}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                View Certificate
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyCoursesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-4xl font-bold mb-4">My Courses</h1>
          <p className="text-gray-400 text-lg">Track your learning progress and achievements</p>
        </div>

        {/* In Progress Section */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-8">
            <Clock className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-semibold text-white">In Progress</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inProgressCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>

        {/* Completed Section */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-8">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-semibold text-white">Completed</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>

        {/* Saved Section */}
        <div>
          <div className="flex items-center gap-2 mb-8">
            <BookmarkIcon className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-semibold text-white">Saved for Later</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 