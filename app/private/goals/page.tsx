import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Clock, CheckCircle2, Calendar, ArrowRight, Trophy, Star } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  progress: number;
  type: 'daily' | 'weekly' | 'monthly' | 'long-term';
  status: 'in-progress' | 'completed' | 'overdue';
}

const goals: Goal[] = [
  {
    id: "1",
    title: "Complete Python Basics",
    description: "Finish all fundamental Python programming modules",
    deadline: "Next Week",
    progress: 65,
    type: 'weekly',
    status: 'in-progress'
  },
  {
    id: "2",
    title: "Master Data Structures",
    description: "Complete advanced data structures and algorithms course",
    deadline: "This Month",
    progress: 30,
    type: 'monthly',
    status: 'in-progress'
  },
  {
    id: "3",
    title: "Daily Coding Practice",
    description: "Solve at least 2 programming problems",
    deadline: "Today",
    progress: 50,
    type: 'daily',
    status: 'in-progress'
  },
  {
    id: "4",
    title: "Full Stack Development",
    description: "Complete the full stack web development bootcamp",
    deadline: "3 Months",
    progress: 25,
    type: 'long-term',
    status: 'in-progress'
  }
];

const completedGoals: Goal[] = [
  {
    id: "5",
    title: "Git Basics",
    description: "Learn fundamental Git commands and workflows",
    deadline: "Last Week",
    progress: 100,
    type: 'weekly',
    status: 'completed'
  }
];

function GoalCard({ goal }: { goal: Goal }) {
  const statusColors = {
    'in-progress': 'text-blue-400',
    'completed': 'text-green-400',
    'overdue': 'text-red-400'
  };

  const typeIcons = {
    'daily': Clock,
    'weekly': Calendar,
    'monthly': Target,
    'long-term': Star
  };

  const Icon = typeIcons[goal.type];

  return (
    <Card className="bg-[#141414] border-gray-800 group hover:border-blue-500/40 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="w-5 h-5 text-blue-400" />
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
            {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)}
          </span>
          <span className={`text-xs ml-auto ${statusColors[goal.status]}`}>
            {goal.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
            {goal.status === 'in-progress' && <ArrowRight className="w-4 h-4" />}
          </span>
        </div>
        <h3 className="text-lg font-semibold mb-2 text-white">{goal.title}</h3>
        <p className="text-sm text-gray-400 mb-4">{goal.description}</p>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span>{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Deadline:</span>
            <span className="text-white">{goal.deadline}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GoalsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Learning Goals</h1>
          <p className="text-gray-400 text-lg">Track and manage your learning objectives</p>
        </div>

        {/* Active Goals */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-8">
            <Target className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-semibold">Active Goals</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>

        {/* Completed Goals */}
        <div>
          <div className="flex items-center gap-2 mb-8">
            <Trophy className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-semibold">Completed Goals</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 