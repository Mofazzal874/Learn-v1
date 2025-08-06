import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PublishUnpublishButtons from "./PublishUnpublishButtons";
import DeleteCourseButton from "../components/DeleteCourseButton";
import { 
  BookOpen, 
  Users, 
  Star, 
  Edit, 
  BarChart, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Download, 
  GraduationCap, 
  Plus, 
  Settings,
  Target,
  Layout
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import { parseCourseData } from "@/lib/utils/course-data";

async function getCourse(id: string) {
  await connectDB();
  try {
    const course = await Course.findById(id);
    if (!course) {
      return null;
    }
    return JSON.parse(JSON.stringify(course)); 
  } catch (error) {
    console.error("Error fetching course:", error);
    return null;
  }
}

export default async function TutorCourseDetails({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return redirect("/login");
  
  const { id } = await params;
  const rawCourse = await getCourse(id);
  const course = rawCourse ? parseCourseData(rawCourse) : null;
  if (!course) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Course Not Found</h1>
          <p className="text-gray-400 mb-6">The course you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Link href="/tutor/courses">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Back to Courses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Verify the logged-in tutor owns this course
  if (course.tutorId !== session.user.id) {
    return redirect("/tutor/courses");
  }

  // Calculate total lessons
  const totalLessons = course.sections?.reduce(
    (sum: number, section: any) => sum + (section.lessons?.length || 0), 
    0
  ) || 0;

  // Placeholder data until we implement actual analytics
  const completionRate = 65; // Placeholder
  const totalRevenue = course.price * (course.totalStudents || 0);
  const averageRating = course.rating || 0;

  // Prerequisites and outcomes are now properly parsed by parseCourseData
  const prerequisites = course.prerequisites || [];
  const outcomes = course.outcomes || [];
  
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Link href="/tutor/courses" className="hover:text-white transition-colors">
                Courses
              </Link>
              <span>/</span>
              <span className="text-white">{course.title}</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{course.totalStudents || 0} students enrolled</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400" />
                <span>{averageRating}/5</span>
              </div>
              <div>
                {course.published ? (
                  <span className="text-green-400">Published</span>
                ) : (
                  <span className="text-yellow-400">Draft</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href={`/tutor/courses/${id}/content`}>
              <Button variant="outline" className="border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800">
                <Layout className="h-4 w-4 mr-2" />
                Course Content
              </Button>
            </Link>
            <Link href={`/tutor/courses/${id}/edit`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Edit className="h-4 w-4 mr-2" />
                Edit Course
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Preview */}
            <Card className="bg-[#141414] border-gray-800 overflow-hidden">
              <div className="relative w-full aspect-video bg-gray-900">
                {course.previewVideo ? (
                  <video 
                    className="w-full h-full object-cover" 
                    src={course.previewVideo} 
                    controls 
                    poster={course.thumbnail}
                  />
                ) : course.thumbnail ? (
                  <Image
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="h-20 w-20 text-gray-700" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">About This Course</h2>
                <p className="text-gray-300">
                  {course.description}
                </p>
                {/* Course metadata */}
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Level</div>
                      <div className="font-medium text-white capitalize">{course.level}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Layout className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Sections</div>
                      <div className="font-medium text-white">{course.sections?.length || 0}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Lessons</div>
                      <div className="font-medium text-white">{totalLessons}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Course Content */}
            <Card className="bg-[#141414] border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">Course Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {course.sections?.map((section: any, index: number) => (
                    <div key={index}>
                      <h3 className="text-md font-semibold text-white mb-2">{section.title}</h3>
                      <p className="text-sm text-gray-400 mb-2">{section.description}</p>
                      <div className="space-y-1 pl-4">
                        {section.lessons?.map((lesson: any, lessonIndex: number) => (
                          <div key={lessonIndex} className="text-sm text-gray-300 py-1 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span>{lesson.title}</span>
                            {lesson.duration && (
                              <span className="text-xs text-gray-500">{lesson.duration}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {(!course.sections || course.sections.length === 0) && (
                    <div className="text-center py-8">
                      <BookOpen className="mx-auto h-12 w-12 text-gray-600 mb-3" />
                      <h3 className="text-gray-300 mb-2">No content yet</h3>
                      <p className="text-sm text-gray-500 mb-4">Add sections and lessons to your course</p>
                      <Link href={`/tutor/courses/${id}/content`}>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Course Content
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Requirements & Learning Outcomes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#141414] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Prerequisites</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {prerequisites.length > 0 ? (
                      prerequisites.map((prerequisite: string, index: number) => (
                        <li key={index} className="text-gray-300 flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{prerequisite}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 italic">No prerequisites specified</li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-[#141414] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Learning Outcomes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {outcomes.length > 0 ? (
                      outcomes.map((outcome: string, index: number) => (
                        <li key={index} className="text-gray-300 flex items-start gap-2">
                          <Target className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span>{outcome}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 italic">No learning outcomes specified</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Details */}
            <Card className="bg-[#141414] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Price</span>
                    <span className="text-green-400 font-semibold">
                      {course.isFree ? "Free" : `$${course.price.toFixed(2)}`}
                    </span>
                  </div>

                  {course.discountedPrice && course.discountEnds && new Date(course.discountEnds) > new Date() && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-400">Discounted Price</span>
                      <div>
                        <span className="text-green-400 font-semibold">${course.discountedPrice.toFixed(2)}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          until {format(new Date(course.discountEnds), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Category</span>
                  <span className="text-white capitalize">{course.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Certificate</span>
                  <span className="text-white">{course.certificate ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Created On</span>
                  <span className="text-white">
                    {course.createdAt ? format(new Date(course.createdAt), 'MMM d, yyyy') : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Last Updated</span>
                  <span className="text-white">
                    {course.updatedAt ? format(new Date(course.updatedAt), 'MMM d, yyyy') : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Course Stats */}
            <Card className="bg-[#141414] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enrollment */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Total Students</span>
                    <span className="text-white font-semibold">{course.totalStudents || 0}</span>
                  </div>
                </div>

                {/* Completion Rate */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Completion Rate</span>
                    <span className="text-white font-semibold">{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2 bg-gray-800">
                    <div className="h-full bg-blue-500 rounded-full" />
                  </Progress>
                </div>

                {/* Rating */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Average Rating</span>
                    <span className="text-white font-semibold flex items-center">
                      {averageRating}
                      <Star className="h-4 w-4 text-yellow-400 ml-1 inline" />
                    </span>
                  </div>
                  <Progress value={averageRating * 20} className="h-2 bg-gray-800">
                    <div className="h-full bg-yellow-500 rounded-full" />
                  </Progress>
                </div>

                {/* Revenue */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Total Revenue</span>
                    <span className="text-green-400 font-semibold">${totalRevenue.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-[#141414] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href={`/tutor/courses/${id}/content`}>
                    <Button className="w-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                      <Layout className="h-4 w-4 mr-2" />
                      Manage Content
                    </Button>
                  </Link>
                  <Link href={`/tutor/courses/${id}/edit`}>
                    <Button className="w-full bg-green-500/10 text-green-400 hover:bg-green-500/20">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Details
                    </Button>
                  </Link>
                  <PublishUnpublishButtons 
                    courseId={id} 
                    published={course.published} 
                  />
                  <DeleteCourseButton 
                    courseId={id}
                    courseName={course.title}
                    variant="button"
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}