import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { BookOpen, MoreVertical, Users, Star, Eye, Edit, Trash2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import { redirect } from "next/navigation";

// Function to get courses from the database
async function getTutorCourses(userId: string) {
  await connectDB();
  const courses = await Course.find({ tutorId: userId }).sort({ createdAt: -1 });
  return JSON.parse(JSON.stringify(courses)); // Convert MongoDB docs to plain objects
}

export default async function TutorCourses() {
  const session = await auth();
  if (!session) return redirect("/login");

  // Fetch courses from the database
  const courses = await getTutorCourses(session.user.id);

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Your Courses</h1>
              <p className="text-gray-400">Manage and track your course content</p>
            </div>
            <Link href="/tutor/courses/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Course
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No courses yet</h3>
                <p className="text-gray-400 mb-6">Get started by creating your first course</p>
                <Link href="/tutor/courses/new">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Course
                  </Button>
                </Link>
              </div>
            ) : (
              courses.map((course) => (
                <Card key={course._id} className="bg-[#141414] border-gray-800">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <Link href={`/tutor/courses/${course._id}`}>
                            <h3 className="text-xl font-semibold text-white mb-2 hover:text-blue-400 transition-colors">
                              {course.title}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{course.totalStudents || 0} students</span>
                            </div>
                            {course.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-400" />
                                <span>{course.rating}</span>
                              </div>
                            )}
                            <span>
                              {course.published ? (
                                <span className="text-green-400">Published</span>
                              ) : (
                                <span className="text-yellow-400">Draft</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-[#1a1a1a] border-gray-800">
                          <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                            <Link href={`/courses/${course.slug || course._id}`} className="flex w-full items-center">
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                            <Link href={`/tutor/courses/${course._id}/edit`} className="flex w-full items-center">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Course
                            </Link>
                          </DropdownMenuItem>
                          <form action={`/api/courses/${course._id}/delete`}>
                            <DropdownMenuItem className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-900/20">
                              <button type="submit" className="flex w-full items-center">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </button>
                            </DropdownMenuItem>
                          </form>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-4">
                      <div className="bg-[#1a1a1a] rounded-lg px-4 py-2">
                        <div className="text-sm text-gray-400">Price</div>
                        <div className="text-lg font-semibold text-green-400">
                          {course.isFree ? "Free" : `$${course.price.toFixed(2)}`}
                        </div>
                      </div>
                      <div className="bg-[#1a1a1a] rounded-lg px-4 py-2">
                        <div className="text-sm text-gray-400">Completion Rate</div>
                        <div className="text-lg font-semibold text-blue-400">--</div>
                      </div>
                      <div className="bg-[#1a1a1a] rounded-lg px-4 py-2">
                        <div className="text-sm text-gray-400">Total Reviews</div>
                        <div className="text-lg font-semibold text-purple-400">{course.totalReviews || 0}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}