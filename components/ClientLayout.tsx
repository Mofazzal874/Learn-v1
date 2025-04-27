'use client';

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-[#141414]">
            <SheetHeader className="px-4 py-2 text-white">
              <SheetTitle className="text-white">Navigation Menu</SheetTitle>
            </SheetHeader>
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:block fixed top-0 left-0 h-screen bg-[#141414] 
          transition-all duration-300 ease-in-out
          ${isHovered ? 'w-64' : 'w-20'}`}
      >
        <div className={`transition-all duration-300 ease-in-out ${isHovered ? 'w-64' : 'w-20'}`}>
          <Sidebar compact={!isHovered} />
        </div>
      </div>

      {/* Content Area */}
      <div 
        className={`transition-all duration-300 ease-in-out min-h-screen
          ${isHovered ? 'md:pl-64' : 'md:pl-20'}`}
      >
        {children}
      </div>
    </div>
  );
};