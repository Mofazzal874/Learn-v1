'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sidebar } from './Sidebar';

interface ClientLayoutProps {
  children: React.ReactNode;
  navbar: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children, navbar }) => {
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: { target: any; }) => {
      // Check if click is outside both sidebar and toggle button
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target)
      ) {
        setIsDesktopSidebarOpen(false);
      }
    };

    // Only add listener if sidebar is open
    if (isDesktopSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDesktopSidebarOpen]);

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      {/* Top Navigation Bar - Always visible */}
      <div className="fixed top-0 left-0 right-0 h-16 z-40">
        {/* Mobile Menu Button */}
        <div className="md:hidden absolute left-4 top-1/2 transform -translate-y-1/2 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
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

        {/* Desktop Menu Toggle Button - Moved to the sidebar */}
        <div className="hidden md:block fixed top-3 left-3 z-50" ref={toggleButtonRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-gray-800"
            onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Navbar with adjusted padding for desktop */}
        <div className="md:pl-16">
          {navbar}
        </div>
      </div>

      {/* Desktop Sidebar - Fixed position with transition */}
      <div 
        ref={sidebarRef}
        className={`hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] bg-[#141414] 
          transition-all duration-300 ease-in-out transform
          ${isDesktopSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'}`}
      >
        <Sidebar />
      </div>

      {/* Main Content - Adjusted padding with transition */}
      <div 
        className={`pt-16 transition-all duration-300 ease-in-out
          ${isDesktopSidebarOpen ? 'md:pl-64' : 'md:pl-0'}`}
      >
        <main className="p-4 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};