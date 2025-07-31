"use client";

import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface RoleSelectProps {
  mode: 'login' | 'register';
}

function RoleSelect({ mode }: RoleSelectProps) {
  const title = mode === 'login' ? 'Sign in as' : 'Sign up as';
  
  const handleRoleSelection = (selectedRole: string) => {
    // Store the selected role in a cookie
    document.cookie = `selected-role=${selectedRole}; path=/; max-age=3600; SameSite=Lax`;
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 blur-3xl"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/" className="flex justify-center mb-8">
          <h2 className="text-3xl font-bold text-white">Learn</h2>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white mb-8">
          {title}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href={`/${mode}?role=user`} onClick={() => handleRoleSelection('user')}>
            <Card className="bg-[#141414] border-blue-500/20 hover:border-blue-500/40 transition-colors cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center">
                <Users className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Learner</h3>
                <p className="text-sm text-gray-400 text-center">
                  Join to learn and grow your skills
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${mode}?role=tutor`} onClick={() => handleRoleSelection('tutor')}>
            <Card className="bg-[#141414] border-purple-500/20 hover:border-purple-500/40 transition-colors cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center">
                <GraduationCap className="h-12 w-12 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Tutor</h3>
                <p className="text-sm text-gray-400 text-center">
                  Create and sell your courses
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RoleSelectPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
  return <RoleSelect mode={mode as 'login' | 'register'} />;
}