import Link from "next/link";
import { Button } from "../ui/button";
import { getSession } from "@/lib/getSession";
import { signOut } from "@/auth";
import { Menu, Search, Compass, BookOpen } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";

const Navbar = async () => {
  const session = await getSession();
  const user = session?.user;

  const NavItems = () => (
    <>
      {/* Explore Link */}
      <li>
        <Link href="/explore" className="flex items-center space-x-1 hover:text-blue-400 transition-colors">
          <Compass className="w-4 h-4" />
          <span>Explore</span>
        </Link>
      </li>

      {!user ? (
        <>
          <li>
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </li>
          <li>
            <Link 
              href="/register" 
              className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Sign up
            </Link>
          </li>
        </>
      ) : (
        <>
          <li>
            <Link href="/private/dashboard" className="flex items-center space-x-1 hover:text-blue-400 transition-colors">
              <BookOpen className="w-4 h-4" />
              <span>My Learning</span>
            </Link>
          </li>
          <li>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <Button type="submit" variant="ghost" className="text-gray-200 hover:text-white hover:bg-transparent">
                Sign out
              </Button>
            </form>
          </li>
        </>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 bg-[#0d1117] border-b border-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Search Section */}
          <div className="flex items-center flex-1">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-blue-500" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                  Learn
                </span>
              </Link>
            </div>
            
            {/* Search Bar - Hidden on mobile */}
            <div className="hidden md:block ml-8 flex-1 max-w-2xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search topics, courses, or skills..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-[#0d1117] text-white border-l border-gray-800">
                <SheetHeader>
                  <SheetTitle className="text-white">Menu</SheetTitle>
                </SheetHeader>
                {/* Mobile Search */}
                <div className="mt-4 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-6">
                  <ul className="space-y-4">
                    <NavItems />
                  </ul>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Navigation Items */}
          <ul className="hidden md:flex items-center space-x-6">
            <NavItems />
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;