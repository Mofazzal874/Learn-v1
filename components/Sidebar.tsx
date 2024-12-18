'use client';

import React from 'react';
import { Home, BookOpen, PlusCircle, Settings, User, BarChart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScrollArea } from "@/components/ui/scroll-area";

export const Sidebar = ({ className = '' }) => {
  const pathname = usePathname();
  
  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/private/dashboard' },
    { icon: BarChart, label: 'Your Progress', href: '/private/progress' },
    { icon: BookOpen, label: 'Your Roadmaps', href: '/private/roadmaps' },
    { icon: PlusCircle, label: 'Generate Roadmap', href: '/private/generate' },
    { icon: Settings, label: 'Settings', href: '/private/settings' },
    { icon: User, label: 'Profile', href: '/private/profile' },
  ];

  return (
    <div className={`h-full bg-[#141414] text-white ${className}`}>
      <ScrollArea className="h-[calc(100vh-7rem)]"> {/* Adjusted height to account for sheet header */}
        <div className="flex flex-col space-y-2 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all
                  ${isActive 
                    ? 'bg-gray-800 text-white' 
                    : 'hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};