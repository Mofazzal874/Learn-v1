import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Brain, Target, Trophy, Clock, ChartLine, Flame } from "lucide-react";

interface ProgressStats {
  daily: number;
  weekly: number;
  monthly: number;
  streak: number;
  totalHours: number;
  coursesCompleted: number;
}

const stats: ProgressStats = {
  daily: 75,
  weekly: 60,
  monthly: 85,
  streak: 7,
  totalHours: 48,
  coursesCompleted: 3
};

interface LearningActivity {
  date: string;
  hours: number;
  completed: string[];
}

const recentActivity: LearningActivity[] = [
  {
    date: "Today",
    hours: 2.5,
    completed: ["Introduction to Python", "Basic Data Types"]
  },
  {
    date: "Yesterday",
    hours: 1.5,
    completed: ["Functions and Methods"]
  },
  {
    date: "2 days ago",
    hours: 3,
    completed: ["Control Flow", "Error Handling"]
  }
];

function StatCard({ title, value, icon: Icon, color }: { 
  title: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  return (
    <Card className="bg-[#141414] border-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressSection({ title, value, icon: Icon, color }: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <span className="text-sm text-gray-400">{title}</span>
        </div>
        <span className="text-sm text-white">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

export default function ProgressPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Learning Progress</h1>
          <p className="text-gray-400 text-lg">Track your learning journey and achievements</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Learning Streak"
            value={`${stats.streak} days`}
            icon={Flame}
            color="bg-orange-500"
          />
          <StatCard
            title="Total Learning Hours"
            value={`${stats.totalHours}h`}
            icon={Clock}
            color="bg-blue-500"
          />
          <StatCard
            title="Courses Completed"
            value={stats.coursesCompleted}
            icon={Trophy}
            color="bg-green-500"
          />
          <StatCard
            title="Monthly Progress"
            value={`${stats.monthly}%`}
            icon={ChartLine}
            color="bg-purple-500"
          />
        </div>

        {/* Progress Tracking */}
        <Card className="bg-[#141414] border-gray-800 mb-12">
          <CardHeader>
            <CardTitle className="text-xl text-white font-semibold">Progress Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProgressSection
              title="Daily Goal"
              value={stats.daily}
              icon={Target}
              color="text-green-400"
            />
            <ProgressSection
              title="Weekly Progress"
              value={stats.weekly}
              icon={ChartLine}
              color="text-blue-400"
            />
            <ProgressSection
              title="Monthly Target"
              value={stats.monthly}
              icon={Brain}
              color="text-purple-400"
            />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-[#141414] border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl text-white font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.map((activity, index) => (
                <div key={index} className="border-b border-gray-800 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">{activity.date}</span>
                    <span className="text-sm text-blue-400">{activity.hours} hours</span>
                  </div>
                  <div className="space-y-2">
                    {activity.completed.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-white">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 