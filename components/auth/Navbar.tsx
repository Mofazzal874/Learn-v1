import Link from "next/link";
import { Button } from "../ui/button";
import { getSession } from "@/lib/getSession";
import { signOut } from "@/auth";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = async () => {
  const session = await getSession();
  const user = session?.user;

  const NavItems = () => (
    <>
      {!user ? (
        <>
          <li>
            <Link href="/login" className="hover:text-gray-400">
              Login
            </Link>
          </li>
          <li>
            <Link href="/register" className="hover:text-gray-400">
              Register
            </Link>
          </li>
        </>
      ) : (
        <>
          <li>
            <Link href="/private/dashboard" className="hover:text-gray-400">
              Dashboard
            </Link>
          </li>
          <li>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <Button type="submit" variant="ghost" className="text-white">
                Logout
              </Button>
            </form>
          </li>
        </>
      )}
    </>
  );

  return (
    <nav className="flex items-center h-16 bg-[#141414] text-white px-4">
      <div className="w-full flex justify-between items-center md:max-w-screen-2xl md:mx-auto">
        {/* Logo - centered on mobile, left-aligned on desktop */}
        <div className="flex-1 flex justify-center md:justify-start">
          <Link href="/" className="text-xl font-bold">
            Learn
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] bg-[#141414] text-white border-l border-gray-800">
              <SheetHeader>
                <SheetTitle className="text-white">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <ul className="space-y-4">
                  <NavItems />
                </ul>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Navigation Items */}
        <ul className="hidden md:flex items-center space-x-4">
          <NavItems />
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;