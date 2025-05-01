import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, DollarSign, Star, PlusCircle, Edit, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function TutorDashboard() {
  const session = await auth();
  if (!session) return null;

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header with Welcome Message */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {session.user.firstName}! 👋</h1>
              <p className="text-gray-400">Here's what's happening with your courses today.</p>
            </div>
            <Link href="/tutor/courses/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Course
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="bg-[#141414] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Active Students
                </CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">1,234</div>
                <p className="text-xs text-blue-400 mt-1">+12% from last month</p>
              </CardContent>
            </Card>

            <Card className="bg-[#141414] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Total Courses
                </CardTitle>
                <BookOpen className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">8</div>
                <p className="text-xs text-purple-400 mt-1">3 in development</p>
              </CardContent>
            </Card>

            <Card className="bg-[#141414] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">$12,458</div>
                <p className="text-xs text-green-400 mt-1">+8% from last month</p>
              </CardContent>
            </Card>

            <Card className="bg-[#141414] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Average Rating
                </CardTitle>
                <Star className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">4.8</div>
                <p className="text-xs text-yellow-400 mt-1">From 856 reviews</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Courses */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Your Courses</h2>
              <Link href="/tutor/courses">
                <Button variant="outline" className="text-gray-400 border-gray-800">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Course Card 1 */}
              <Card className="bg-[#141414] border-gray-800">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Python Programming Masterclass
                      </h3>
                      <p className="text-sm text-gray-400">892 students enrolled</p>
                    </div>
                    <Link href="/tutor/courses/1/edit">
                      <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Completion Rate</span>
                      <span className="text-blue-400">75%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4 text-sm">
                    <div className="flex items-center text-yellow-400">
                      <Star className="h-4 w-4 fill-yellow-400 mr-1" />
                      <span>4.8</span>
                    </div>
                    <span className="text-gray-400">$59.99</span>
                  </div>
                </CardContent>
              </Card>

              {/* Course Card 2 */}
              <Card className="bg-[#141414] border-gray-800">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Web Development Bootcamp
                      </h3>
                      <p className="text-sm text-gray-400">654 students enrolled</p>
                    </div>
                    <Link href="/tutor/courses/2/edit">
                      <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Completion Rate</span>
                      <span className="text-blue-400">82%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4 text-sm">
                    <div className="flex items-center text-yellow-400">
                      <Star className="h-4 w-4 fill-yellow-400 mr-1" />
                      <span>4.9</span>
                    </div>
                    <span className="text-gray-400">$79.99</span>
                  </div>
                </CardContent>
              </Card>

              {/* Course Card 3 */}
              <Card className="bg-[#141414] border-gray-800">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Machine Learning Fundamentals
                      </h3>
                      <p className="text-sm text-gray-400">423 students enrolled</p>
                    </div>
                    <Link href="/tutor/courses/3/edit">
                      <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Completion Rate</span>
                      <span className="text-blue-400">68%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4 text-sm">
                    <div className="flex items-center text-yellow-400">
                      <Star className="h-4 w-4 fill-yellow-400 mr-1" />
                      <span>4.7</span>
                    </div>
                    <span className="text-gray-400">$89.99</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <Card className="bg-[#141414] border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/tutor/courses/new">
                <Button className="w-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Course
                </Button>
              </Link>
              <Link href="/tutor/analytics">
                <Button className="w-full bg-purple-500/10 text-purple-400 hover:bg-purple-500/20">
                  <Users className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
              <Link href="/tutor/earnings">
                <Button className="w-full bg-green-500/10 text-green-400 hover:bg-green-500/20">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Check Earnings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}