import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge"; // Badge component not available
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  BookOpen, 
  Users, 
  Clock, 
  CheckCircle, 
  Play,
  FileText,
  Award,
  User,
  Globe,
  ArrowLeft,
  PlayCircle,
  Lock,
  ChevronRight
} from "lucide-react";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import { UserProgress } from "@/models/UserProgress";

// Parse string arrays that might be JSON encoded
const parseStringArray = (data: any): string[] => {
  if (!data) return [];
  
  // If it's already an array, return it
  if (Array.isArray(data)) {
    return data.map(item => {
      // If array items are JSON strings, parse them
      if (typeof item === 'string' && (item.startsWith('[') || item.startsWith('{'))) {
        try {
          const parsed = JSON.parse(item);
          return Array.isArray(parsed) ? parsed.join(', ') : parsed;
        } catch {
          return item;
        }
      }
      return item;
    });
  }
  
  // If it's a string, try to parse it as JSON
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // If JSON parsing fails, return as single item
      return [data];
    }
  }
  
  return [];
};

// Function to get course from the database
async function getCourse(id: string) {
  await connectDB();
  try {
    const course = await Course.findById(id)
      .populate('tutorId', 'firstName lastName image')
      .lean();
    return JSON.parse(JSON.stringify(course));
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}

// Function to check if user is enrolled and get progress
async function getUserProgress(userId: string, courseId: string) {
  if (!userId) return null;
  
  await connectDB();
  try {
    const userProgress = await UserProgress.findOne({ userId }).lean() as {
      enrolledCourses?: { courseId: { toString(): string } }[]
    } | null;
    
    if (!userProgress?.enrolledCourses) return null;
    
    const enrollment = userProgress.enrolledCourses.find(
      (enrollment: any) => enrollment.courseId.toString() === courseId
    );
    
    return enrollment || null;
  } catch (error) {
    console.error('Error checking user progress:', error);
    return null;
  }
}

interface CourseLearnPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function CourseLearnPage({ params }: CourseLearnPageProps) {
  const session = await auth();
  const resolvedParams = await params;
  
  if (!session) {
    redirect("/login");
  }

  const course = await getCourse(resolvedParams.id);
  const userProgress = await getUserProgress(session.user.id, resolvedParams.id);

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
          <p className="text-gray-400 mb-6">The course you&apos;re trying to access doesn&apos;t exist.</p>
          <Link href="/explore">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Explore
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if user is enrolled
  if (!userProgress) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
          <p className="text-gray-400 mb-6">You need to enroll in this course to access the content.</p>
          <Link href={`/courses/${resolvedParams.id}`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              View Course Details
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate progress
  const totalLessons = course.sections?.reduce((sum: number, section: any) => 
    sum + (section.lessons?.length || 0), 0) || 0;

  const totalDuration = course.sections?.reduce((total: number, section: any) => {
    return total + (section.lessons?.reduce((sectionTotal: number, lesson: any) => {
      const duration = lesson.duration || '0';
      const minutes = parseInt(duration) || 0;
      return sectionTotal + minutes;
    }, 0) || 0);
  }, 0) || 0;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Calculate completion progress (placeholder - in real implementation this would come from UserProgress)
  const completedLessons = 0; // TODO: Get from UserProgress
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const prerequisites = parseStringArray(course.prerequisites);
  const outcomes = parseStringArray(course.outcomes);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href={`/courses/${resolvedParams.id}`}>
            <Button variant="outline" className="border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course Details
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Course Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-[#141414] border-gray-800 sticky top-4">
              <CardHeader>
                <CardTitle className="text-white text-lg">Course Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Overview */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Overall Progress</span>
                      <span className="text-blue-400">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  <div className="text-sm text-gray-400">
                    <div className="flex justify-between mb-1">
                      <span>Completed:</span>
                      <span>{completedLessons}/{totalLessons} lessons</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{formatDuration(totalDuration)}</span>
                    </div>
                  </div>

                  {/* Certificate Badge */}
                  {course.certificate && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-400 text-sm">
                        <Award className="h-4 w-4" />
                        <span>Certificate Available</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Course Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm">
                  {course.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-sm">
                  {course.level}
                </span>
                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm">
                  Enrolled
                </span>
              </div>

              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              {course.subtitle && (
                <p className="text-xl text-gray-300 mb-4">{course.subtitle}</p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{course.tutorId?.firstName} {course.tutorId?.lastName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{course.totalStudents || 0} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>{course.language || 'English'}</span>
                </div>
              </div>
            </div>

            {/* Course Sections */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Course Content</h2>
                <div className="text-sm text-gray-400">
                  {course.sections?.length || 0} sections • {totalLessons} lessons
                </div>
              </div>

              {course.sections && course.sections.length > 0 ? (
                <div className="space-y-4">
                  {course.sections.map((section: any, sectionIndex: number) => (
                    <Card key={section._id || sectionIndex} className="bg-[#141414] border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">
                          Section {sectionIndex + 1}: {section.title}
                        </CardTitle>
                        {section.description && (
                          <p className="text-gray-400 text-sm">{section.description}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {section.lessons?.map((lesson: any, lessonIndex: number) => (
                            <div
                              key={lesson._id || lessonIndex}
                              className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 group-hover:bg-blue-600 transition-colors">
                                  {lesson.type === 'video' && (
                                    <PlayCircle className="h-4 w-4 text-blue-400 group-hover:text-white" />
                                  )}
                                  {lesson.type === 'article' && (
                                    <FileText className="h-4 w-4 text-purple-400 group-hover:text-white" />
                                  )}
                                  {lesson.type === 'resource' && (
                                    <BookOpen className="h-4 w-4 text-green-400 group-hover:text-white" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-white font-medium group-hover:text-blue-400 transition-colors">
                                    {lesson.title}
                                  </h4>
                                  {lesson.description && (
                                    <p className="text-gray-500 text-sm">{lesson.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {lesson.duration && (
                                  <span className="text-gray-500 text-sm">{lesson.duration}</span>
                                )}
                                <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-[#141414] border-gray-800">
                  <CardContent className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Content Available</h3>
                    <p className="text-gray-400">
                      The instructor hasn&apos;t added any lessons to this course yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Additional Course Info */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              {/* Prerequisites */}
              {prerequisites.length > 0 && (
                <Card className="bg-[#141414] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Prerequisites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {prerequisites.map((prerequisite: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-gray-300">
                          <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span>{prerequisite}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Learning Outcomes */}
              {outcomes.length > 0 && (
                <Card className="bg-[#141414] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">What You&apos;ll Learn</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {outcomes.map((outcome: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-gray-300">
                          <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
