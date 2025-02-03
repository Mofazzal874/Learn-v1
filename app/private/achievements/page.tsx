import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Star, Award, Crown, Flame, Target, BookOpen } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'badge' | 'certificate' | 'milestone';
  icon: any;
  color: string;
  date: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

const achievements: Achievement[] = [
  {
    id: "1",
    title: "Python Master",
    description: "Completed all Python programming courses with excellence",
    type: "certificate",
    icon: Trophy,
    color: "bg-yellow-500",
    date: "March 15, 2024",
    rarity: "epic"
  },
  {
    id: "2",
    title: "Quick Learner",
    description: "Completed 5 courses in under 30 days",
    type: "badge",
    icon: Flame,
    color: "bg-orange-500",
    date: "February 28, 2024",
    rarity: "rare"
  },
  {
    id: "3",
    title: "Perfect Score",
    description: "Achieved 100% in Data Structures assessment",
    type: "milestone",
    icon: Target,
    color: "bg-green-500",
    date: "March 1, 2024",
    rarity: "epic"
  },
  {
    id: "4",
    title: "Consistent Learner",
    description: "Maintained a 7-day learning streak",
    type: "badge",
    icon: Medal,
    color: "bg-blue-500",
    date: "March 10, 2024",
    rarity: "common"
  },
  {
    id: "5",
    title: "Web Development Pro",
    description: "Completed the Full Stack Development Bootcamp",
    type: "certificate",
    icon: Crown,
    color: "bg-purple-500",
    date: "January 15, 2024",
    rarity: "legendary"
  }
];

const stats = {
  totalAchievements: achievements.length,
  certificates: achievements.filter(a => a.type === 'certificate').length,
  badges: achievements.filter(a => a.type === 'badge').length,
  milestones: achievements.filter(a => a.type === 'milestone').length
};

function StatCard({ title, value, icon: Icon, color }: {
  title: string;
  value: number;
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

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const rarityColors = {
    common: 'border-gray-500',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-yellow-500'
  };

  const rarityBadgeColors = {
    common: 'bg-gray-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-yellow-500'
  };

  return (
    <Card className={`bg-[#141414] border-2 ${achievement.rarity ? rarityColors[achievement.rarity] : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-lg ${achievement.color} flex items-center justify-center`}>
            <achievement.icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{achievement.title}</h3>
            <p className="text-sm text-gray-400">{achievement.description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{achievement.date}</span>
          {achievement.rarity && (
            <span className={`text-xs px-2 py-1 rounded-full ${rarityBadgeColors[achievement.rarity]} text-white`}>
              {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AchievementsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Achievements</h1>
          <p className="text-gray-400 text-lg">Your learning milestones and accomplishments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Total Achievements"
            value={stats.totalAchievements}
            icon={Trophy}
            color="bg-yellow-500"
          />
          <StatCard
            title="Certificates Earned"
            value={stats.certificates}
            icon={Award}
            color="bg-green-500"
          />
          <StatCard
            title="Badges Collected"
            value={stats.badges}
            icon={Medal}
            color="bg-blue-500"
          />
          <StatCard
            title="Milestones Reached"
            value={stats.milestones}
            icon={Star}
            color="bg-purple-500"
          />
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </div>
    </div>
  );
} 