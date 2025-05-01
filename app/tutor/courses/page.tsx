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

export default async function TutorCourses() {
  const session = await auth();
  if (!session) return null;

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
            {/* Course Card 1 */}
            <Card className="bg-[#141414] border-gray-800">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Python Programming Masterclass
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>892 students</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span>4.8</span>
                        </div>
                        <span>Last updated: 2 days ago</span>
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
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Course
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-900/20">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-6 flex flex-wrap gap-4">
                  <div className="bg-[#1a1a1a] rounded-lg px-4 py-2">
                    <div className="text-sm text-gray-400">Revenue</div>
                    <div className="text-lg font-semibold text-green-400">$5,678</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg px-4 py-2">
                    <div className="text-sm text-gray-400">Completion Rate</div>
                    <div className="text-lg font-semibold text-blue-400">75%</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg px-4 py-2">
                    <div className="text-sm text-gray-400">Total Reviews</div>
                    <div className="text-lg font-semibold text-purple-400">245</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Course Card 2 */}
            <Card className="bg-[#141414] border-gray-800">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Web Development Bootcamp
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>654 students</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span>4.9</span>
                        </div>
                        <span>Last updated: 5 days ago</span>
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
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Course
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-900/20">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-6 flex flex-wrap gap-4">
                  <div className="bg-[#1a1a1a] rounded-lg px-4 py-2">
                    <div className="text-sm text-gray-400">Revenue</div>
                    <div className="text-lg font-semibold text-green-400">$4,230</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg px-4 py-2">
                    <div className="text-sm text-gray-400">Completion Rate</div>
                    <div className="text-lg font-semibold text-blue-400">82%</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg px-4 py-2">
                    <div className="text-sm text-gray-400">Total Reviews</div>
                    <div className="text-lg font-semibold text-purple-400">198</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Course Card 3 */}
            <Card className="bg-[#141414] border-gray-800">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Machine Learning Fundamentals
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>423 students</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span>4.7</span>
                        </div>
                        <span>Last updated: 1 week ago</span>
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
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Course
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-900/20">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-6 flex flex-wrap gap-4">
                  <div className="bg-[#1a1a1a] rounded-lg px-4 py-2">
                    <div className="text-sm text-gray-400">Revenue</div>
                    <div className="text-lg font-semibold text-green-400">$2,550</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg px-4 py-2">
                    <div className="text-sm text-gray-400">Completion Rate</div>
                    <div className="text-lg font-semibold text-blue-400">68%</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg px-4 py-2">
                    <div className="text-sm text-gray-400">Total Reviews</div>
                    <div className="text-lg font-semibold text-purple-400">156</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}