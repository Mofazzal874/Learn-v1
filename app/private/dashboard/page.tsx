import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSession } from "@/lib/getSession";
import { redirect } from "next/navigation";
import { BookOpen, Brain, Target, Trophy} from "lucide-react";


const Dashboard = async () => {
  const session = await getSession();
  const user = session?.user;
  if (!user) return redirect("/");

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 bg-[#0a0a0a]">
        

        <div className="p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {user.firstName}! 👋
            </h1>
            <p className="text-gray-400 mt-2">
              Here's an overview of your learning progress
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="relative bg-[#141414] border border-blue-500/20 shadow-xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
                <CardTitle className="text-sm font-medium text-white">
                  Courses in Progress
                </CardTitle>
                <div className="p-2 bg-blue-500/10 rounded-full">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-white">4</div>
                <p className="text-sm text-blue-200 mt-1">+2 from last month</p>
              </CardContent>
            </Card>

            <Card className="relative bg-[#141414] border border-purple-500/20 shadow-xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-transparent"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
                <CardTitle className="text-sm font-medium text-white">
                  Skills Mastered
                </CardTitle>
                <div className="p-2 bg-purple-500/10 rounded-full">
                  <Brain className="h-4 w-4 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-white">12</div>
                <p className="text-sm text-purple-200 mt-1">+3 this week</p>
              </CardContent>
            </Card>

            <Card className="relative bg-[#141414] border border-pink-500/20 shadow-xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-red-500/10 to-transparent"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
                <CardTitle className="text-sm font-medium text-white">
                  Goals Completed
                </CardTitle>
                <div className="p-2 bg-pink-500/10 rounded-full">
                  <Target className="h-4 w-4 text-pink-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-white">8</div>
                <p className="text-sm text-pink-200 mt-1">80% success rate</p>
              </CardContent>
            </Card>

            <Card className="relative bg-[#141414] border border-red-500/20 shadow-xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/10 to-transparent"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
                <CardTitle className="text-sm font-medium text-white">
                  Achievements
                </CardTitle>
                <div className="p-2 bg-red-500/10 rounded-full">
                  <Trophy className="h-4 w-4 text-red-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-white">15</div>
                <p className="text-sm text-red-200 mt-1">3 new unlocked</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Progress Section */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <Card className="bg-[#141414] border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Activity</TableHead>
                      <TableHead className="text-right text-gray-400">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-gray-800">
                      <TableCell className="text-white">Completed Python Basics</TableCell>
                      <TableCell className="text-right text-gray-400">Today</TableCell>
                    </TableRow>
                    <TableRow className="border-gray-800">
                      <TableCell className="text-white">Started Web Development</TableCell>
                      <TableCell className="text-right text-gray-400">Yesterday</TableCell>
                    </TableRow>
                    <TableRow className="border-gray-800">
                      <TableCell className="text-white">Earned JavaScript Badge</TableCell>
                      <TableCell className="text-right text-gray-400">2 days ago</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Learning Progress */}
            <Card className="bg-[#141414] border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg text-white">Current Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">Python Mastery</span>
                      <span className="text-sm text-blue-400">75%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">Web Development</span>
                      <span className="text-sm text-purple-400">45%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full">
                      <div className="h-2 bg-purple-500 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">Data Science</span>
                      <span className="text-sm text-pink-400">30%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full">
                      <div className="h-2 bg-pink-500 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;