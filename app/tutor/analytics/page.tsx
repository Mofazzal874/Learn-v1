import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Users, Clock, TrendingUp } from "lucide-react";

export default async function TutorAnalytics() {
  const session = await auth();
  if (!session) return null;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-2">
          Track your course performance and student engagement
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-[#141414] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Students
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
              Average Completion Rate
            </CardTitle>
            <BarChart className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">78%</div>
            <p className="text-xs text-green-400 mt-1">+5% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Average Watch Time
            </CardTitle>
            <Clock className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">4.2h</div>
            <p className="text-xs text-purple-400 mt-1">Per student/week</p>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Student Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">+15%</div>
            <p className="text-xs text-orange-400 mt-1">Month over month</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance */}
      <Card className="bg-[#141414] border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Course Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Python Masterclass */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-white">Python Programming Masterclass</span>
                <span className="text-sm text-blue-400">892 students</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <div className="flex justify-between mt-1 text-xs">
                <span className="text-gray-400">4.8/5 rating</span>
                <span className="text-gray-400">75% completion rate</span>
              </div>
            </div>

            {/* Web Development */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-white">Web Development Bootcamp</span>
                <span className="text-sm text-blue-400">654 students</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: '82%' }}></div>
              </div>
              <div className="flex justify-between mt-1 text-xs">
                <span className="text-gray-400">4.9/5 rating</span>
                <span className="text-gray-400">82% completion rate</span>
              </div>
            </div>

            {/* Machine Learning */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-white">Machine Learning Fundamentals</span>
                <span className="text-sm text-blue-400">423 students</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: '68%' }}></div>
              </div>
              <div className="flex justify-between mt-1 text-xs">
                <span className="text-gray-400">4.7/5 rating</span>
                <span className="text-gray-400">68% completion rate</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}