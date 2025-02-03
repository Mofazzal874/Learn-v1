import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Code, Database, Globe, Layers, LineChart, Shield, Workflow } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  category: string;
  progress: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  icon: any;
  color: string;
  recentActivity?: {
    action: string;
    date: string;
  };
}

const skills: Skill[] = [
  {
    id: "1",
    name: "Python Programming",
    category: "Programming Languages",
    progress: 85,
    level: "Advanced",
    icon: Code,
    color: "bg-blue-500",
    recentActivity: {
      action: "Completed Advanced Python Course",
      date: "2 days ago"
    }
  },
  {
    id: "2",
    name: "Data Structures",
    category: "Computer Science",
    progress: 70,
    level: "Intermediate",
    icon: Workflow,
    color: "bg-purple-500",
    recentActivity: {
      action: "Solved 5 DSA Problems",
      date: "1 week ago"
    }
  },
  {
    id: "3",
    name: "Machine Learning",
    category: "AI & Data Science",
    progress: 60,
    level: "Intermediate",
    icon: Brain,
    color: "bg-green-500",
    recentActivity: {
      action: "Started Neural Networks Module",
      date: "3 days ago"
    }
  },
  {
    id: "4",
    name: "Web Development",
    category: "Development",
    progress: 90,
    level: "Expert",
    icon: Globe,
    color: "bg-orange-500",
    recentActivity: {
      action: "Built Full Stack Application",
      date: "1 day ago"
    }
  },
  {
    id: "5",
    name: "Database Management",
    category: "Backend",
    progress: 75,
    level: "Advanced",
    icon: Database,
    color: "bg-red-500",
    recentActivity: {
      action: "Completed SQL Optimization",
      date: "4 days ago"
    }
  }
];

const categories = [
  {
    name: "Programming Languages",
    icon: Code,
    color: "text-blue-400"
  },
  {
    name: "Computer Science",
    icon: Workflow,
    color: "text-purple-400"
  },
  {
    name: "AI & Data Science",
    icon: Brain,
    color: "text-green-400"
  },
  {
    name: "Development",
    icon: Layers,
    color: "text-orange-400"
  },
  {
    name: "Backend",
    icon: Database,
    color: "text-red-400"
  }
];

function SkillCard({ skill }: { skill: Skill }) {
  const levelColors = {
    Beginner: 'text-blue-400',
    Intermediate: 'text-green-400',
    Advanced: 'text-purple-400',
    Expert: 'text-yellow-400'
  };

  return (
    <Card className="bg-[#141414] border-gray-800 hover:border-blue-500/40 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-lg ${skill.color} flex items-center justify-center`}>
            <skill.icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{skill.name}</h3>
            <p className="text-sm text-gray-400">{skill.category}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Mastery Level</span>
              <span className={levelColors[skill.level]}>{skill.level}</span>
            </div>
            <Progress value={skill.progress} className="h-2" />
            <div className="flex justify-end mt-1">
              <span className="text-sm text-gray-400">{skill.progress}%</span>
            </div>
          </div>
          {skill.recentActivity && (
            <div className="pt-4 border-t border-gray-800">
              <p className="text-sm text-gray-400">Recent Activity:</p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-white">{skill.recentActivity.action}</span>
                <span className="text-xs text-gray-500">{skill.recentActivity.date}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SkillsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Skills & Expertise</h1>
          <p className="text-gray-400 text-lg">Track your skill development and mastery levels</p>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Skill Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card key={index} className="bg-[#141414] border-gray-800">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${category.color}`} />
                    <span className="text-sm text-white">{category.name}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Skills Grid */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Your Skills</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 