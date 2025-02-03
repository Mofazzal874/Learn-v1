'use client';

import React from 'react';
import { Home, BookOpen, PlusCircle, Settings, User, BarChart, Compass, Trophy, Brain, Target } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  className?: string;
  compact?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '', compact = false }) => {
  const pathname = usePathname();
  
  const menuItems = [
    { 
      title: 'Main',
      items: [
        { icon: Home, label: 'Dashboard', href: '/private/dashboard' },
        { icon: Compass, label: 'Explore', href: '/explore' },
        { icon: BookOpen, label: 'My Courses', href: '/private/my-courses' },
      ]
    },
    {
      title: 'Learning',
      items: [
        { icon: BarChart, label: 'Progress', href: '/private/progress' },
        { icon: Target, label: 'Goals', href: '/private/goals' },
        { icon: Trophy, label: 'Achievements', href: '/private/achievements' },
        { icon: Brain, label: 'Skills', href: '/private/skills' },
      ]
    },
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', href: '/private/profile' },
        { icon: Settings, label: 'Settings', href: '/private/settings' },
      ]
    }
  ];

  return (
    <div className={`h-full bg-[#141414] text-white ${className}`}>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className={`flex flex-col ${compact ? 'space-y-2' : 'space-y-6'} p-4`}>
          {menuItems.map((group, idx) => (
            <div key={idx}>
              {!compact && (
                <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center ${compact ? 'justify-center' : ''} gap-3 rounded-lg px-4 py-2 text-sm transition-all
                        ${isActive 
                          ? 'bg-blue-500/10 text-blue-400' 
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      {!compact && item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};