import { getSession } from "@/lib/getSession";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Mail, MapPin, Phone, User } from "lucide-react";

export default async function ProfilePage() {
  const session = await getSession();
  const user = session?.user;
  if (!user) return redirect("/");

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      {/* Profile Header */}
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-8">
          {/* Cover Image */}
          <div className="h-48 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-gray-800" />
          
          {/* Profile Picture */}
          <div className="absolute -bottom-12 left-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-[#141414] border-4 border-[#0a0a0a] flex items-center justify-center">
                <User className="w-12 h-12 text-gray-400" />
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="mt-16 grid gap-8">
          {/* Basic Information */}
          <Card className="bg-[#141414] border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-400">First Name</label>
                  <div className="mt-1 p-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white">
                    {user.firstName}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Last Name</label>
                  <div className="mt-1 p-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white">
                    {user.lastName}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Email</label>
                <div className="mt-1 p-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {user.email}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-400">Phone</label>
                  <div className="mt-1 p-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    +1 (555) 000-0000
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Location</label>
                  <div className="mt-1 p-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    New York, USA
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Statistics */}
          <Card className="bg-[#141414] border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl text-white">Learning Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg bg-[#1a1a1a] border border-gray-800">
                  <div className="text-sm text-gray-400">Courses Completed</div>
                  <div className="mt-1 text-2xl font-semibold text-white">12</div>
                </div>
                <div className="p-4 rounded-lg bg-[#1a1a1a] border border-gray-800">
                  <div className="text-sm text-gray-400">Hours Spent</div>
                  <div className="mt-1 text-2xl font-semibold text-white">156</div>
                </div>
                <div className="p-4 rounded-lg bg-[#1a1a1a] border border-gray-800">
                  <div className="text-sm text-gray-400">Certificates Earned</div>
                  <div className="mt-1 text-2xl font-semibold text-white">8</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" className="text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-white">
              Cancel
            </Button>
            <Button className="bg-blue-500 text-white hover:bg-blue-600">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 