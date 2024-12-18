import Link from "next/link";
import { Button } from "../ui/button";
import { getSession } from "@/lib/getSession";
import { signOut } from "@/auth";

const Navbar = async () => {
  const session = await getSession();
  const user = session?.user;

  return (
    <nav className="flex items-center h-16 bg-[#141414] text-white px-4">
      <div className="w-full flex justify-between items-center md:max-w-screen-2xl md:mx-auto">
        {/* Logo - centered on mobile, left-aligned on desktop */}
        <div className="flex-1 flex justify-center md:justify-start">
          <Link href="/" className="text-xl font-bold">
            Learn
          </Link>
        </div>

        {/* Navigation Items - Hidden on mobile, visible on desktop */}
        <ul className="hidden md:flex items-center space-x-4">
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
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;