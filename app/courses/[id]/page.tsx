import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
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
  ArrowLeft
} from "lucide-react";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import { UserProgress } from "@/models/UserProgress";
import CourseRating from "./components/CourseRating";
import CourseReviews from "./components/CourseReviews";

// Function to get course from the database
async function getCourse(id: string) {
  await connectDB();
  try {
    const course = await Course.findById(id)
      .populate('tutorId', 'firstName lastName image')
      .populate('reviews.userId', 'firstName lastName image')
      .lean();
    return JSON.parse(JSON.stringify(course));
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}

// Function to check if user is enrolled in the course
async function checkEnrollment(userId: string, courseId: string) {
  if (!userId) return false;
  
  await connectDB();
  try {
    const userProgress = await UserProgress.findOne({ userId }).lean() as {
      enrolledCourses?: { courseId: { toString(): string } }[]
    } | null;
    
    if (!userProgress?.enrolledCourses) return false;
    
    return userProgress.enrolledCourses.some(
      (enrollment) => 
        enrollment.courseId.toString() === courseId
    );
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return false;
  }
}

interface CoursePageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function CourseDetailsPage({ params }: CoursePageProps) {
  const session = await auth();
  const resolvedParams = await params;
  const course = await getCourse(resolvedParams.id);
  const isEnrolled = session?.user?.id ? await checkEnrollment(session.user.id, resolvedParams.id) : false;

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
          <p className="text-gray-400 mb-6">The course you&apos;re looking for doesn&apos;t exist or has been removed.</p>
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

  // Calculate total lessons and duration
  const totalLessons = course.sections?.reduce((sum: number, section: { lessons?: unknown[] }) => 
    sum + (section.lessons?.length || 0), 0) || 0;

  const totalDuration = course.sections?.reduce((total: number, section: { lessons?: { duration?: string }[] }) => {
    return total + (section.lessons?.reduce((sectionTotal: number, lesson: { duration?: string }) => {
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

  const thumbnailUrl = course.thumbnailAsset?.secure_url || course.thumbnail;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/explore">
            <Button variant="outline" className="border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Explore
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Header */}
            <div className="mb-8">
              <div className="aspect-video w-full bg-gray-800 rounded-lg overflow-hidden mb-6">
                {thumbnailUrl ? (
                  <Image
                    src={thumbnailUrl}
                    alt={course.title}
                    width={800}
                    height={450}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-20 w-20 text-gray-600" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm capitalize">
                  {course.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-sm capitalize">
                  {course.level}
                </span>
              </div>

              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              {course.subtitle && (
                <p className="text-xl text-gray-300 mb-6">{course.subtitle}</p>
              )}

              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">
                    {course.tutorId?.firstName} {course.tutorId?.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">{course.totalStudents || 0} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">{formatDuration(totalDuration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">{totalLessons} lessons</span>
                </div>
                <CourseRating 
                  courseId={resolvedParams.id}
                  isLoggedIn={!!session}
                />
              </div>
            </div>

            {/* Course Description */}
            <Card className="bg-[#141414] border-gray-800 mb-8">
              <CardHeader>
                <CardTitle className="text-white">About this course</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 whitespace-pre-wrap">{course.description}</p>
              </CardContent>
            </Card>

            {/* What you'll learn */}
            {course.outcomes && course.outcomes.length > 0 && (
              <Card className="bg-[#141414] border-gray-800 mb-8">
                <CardHeader>
                  <CardTitle className="text-white">What you&apos;ll learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {course.outcomes.map((outcome: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Content */}
            {course.sections && course.sections.length > 0 && (
              <Card className="bg-[#141414] border-gray-800 mb-8">
                <CardHeader>
                  <CardTitle className="text-white">Course Content</CardTitle>
                  <p className="text-gray-400">
                    {course.sections.length} sections • {totalLessons} lessons • {formatDuration(totalDuration)} total length
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {course.sections.map((section: { _id?: string; title: string; description?: string; lessons?: { _id?: string; title: string; type: string; duration?: string }[] }, index: number) => (
                      <div key={section._id || index} className="border border-gray-800 rounded-lg">
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Section {index + 1}: {section.title}
                          </h3>
                          {section.description && (
                            <p className="text-gray-400 text-sm mb-4">{section.description}</p>
                          )}
                          
                          <div className="space-y-2">
                            {section.lessons?.map((lesson: { _id?: string; title: string; type: string; duration?: string }, lessonIndex: number) => (
                              <div
                                key={lesson._id || lessonIndex}
                                className="flex items-center justify-between py-2 px-4 rounded-lg bg-[#0a0a0a]"
                              >
                                <div className="flex items-center gap-3">
                                  {lesson.type === 'video' && (
                                    <Play className="h-4 w-4 text-blue-400" />
                                  )}
                                  {lesson.type === 'article' && (
                                    <FileText className="h-4 w-4 text-purple-400" />
                                  )}
                                  {lesson.type === 'resource' && (
                                    <BookOpen className="h-4 w-4 text-green-400" />
                                  )}
                                  <span className="text-gray-300">{lesson.title}</span>
                                </div>
                                <span className="text-gray-500 text-sm">{lesson.duration}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <Card className="bg-[#141414] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Prerequisites</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {course.prerequisites.map((prerequisite: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{prerequisite}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Instructor Section */}
            <div className="my-12">
              <Card className="bg-gradient-to-r from-[#141414] to-[#1a1a1a] border-gray-700/50 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-6">
                    {/* Instructor Avatar */}
                    <div className="flex-shrink-0">
                      {course.tutorId?.image ? (
                        <div className="relative">
                          <Image
                            src={course.tutorId.image}
                            alt={`${course.tutorId.firstName} ${course.tutorId.lastName}`}
                            width={72}
                            height={72}
                            className="rounded-full border-2 border-white/10 shadow-lg"
                          />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20"></div>
                        </div>
                      ) : (
                        <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center border-2 border-white/10 shadow-lg">
                          <User className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Instructor Info */}
                    <div className="flex-1">
                      <div className="mb-1">
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {course.tutorId?.firstName} {course.tutorId?.lastName}
                        </h3>
                        <p className="text-gray-300 font-medium">Course Instructor</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reviews Section */}
            <CourseReviews
              courseId={resolvedParams.id}
              initialReviews={course.reviews ? course.reviews.slice(0, 10) : []}
              totalReviews={course.totalReviews || 0}
              isLoggedIn={!!session}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-[#141414] border-gray-800 sticky top-4">
              <CardContent className="p-6">
                {/* Price */}
                <div className="mb-6">
                  {course.isFree ? (
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      Free
                    </div>
                  ) : course.discountedPrice && course.discountedPrice < course.price ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl font-bold text-white">
                          ${course.discountedPrice}
                        </span>
                        <span className="text-lg text-gray-500 line-through">
                          ${course.price}
                        </span>
                      </div>
                      {course.discountEnds && (
                        <p className="text-green-400 text-sm">
                          Limited time offer
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-3xl font-bold text-white mb-2">
                      ${course.price}
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <div className="mb-6">
                  {isEnrolled ? (
                    <div className="space-y-3">
                      <div className="w-full bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg p-3 text-center">
                        ✓ You&apos;re enrolled in this course
                      </div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Continue Learning
                      </Button>
                    </div>
                  ) : session ? (
                    <Link href={`/courses/${resolvedParams.id}/enroll`}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Enroll Now
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/login">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Login to Enroll
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Course Features */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center text-gray-400">
                    <CheckCircle className="h-4 w-4 mr-3 text-green-400" />
                    <span>Full lifetime access</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <CheckCircle className="h-4 w-4 mr-3 text-green-400" />
                    <span>Access on mobile and desktop</span>
                  </div>
                  {course.certificate && (
                    <div className="flex items-center text-gray-400">
                      <Award className="h-4 w-4 mr-3 text-green-400" />
                      <span>Certificate of completion</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-400">
                    <Globe className="h-4 w-4 mr-3 text-green-400" />
                    <span>{course.language || 'English'}</span>
                  </div>
                </div>

                {/* Course Info */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-gray-300">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last updated:</span>
                    <span className="text-gray-300">
                      {new Date(course.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Language:</span>
                    <span className="text-gray-300">{course.language || 'English'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}