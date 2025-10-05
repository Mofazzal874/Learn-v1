import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { getSession } from "@/lib/getSession";
import { User } from "@/models/User";
import { UserProgress } from "@/models/UserProgress";

export async function GET(req: NextRequest) {
  await connectDB();

  const session = await getSession();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  try{
    const user = await User.findById(session.user.id).lean();
    if(!user){
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }

    const userProgress = await UserProgress.findOne({ userId: session.user.id }).lean();

    const userProgressData = {
      completedCourses: userProgress?.totalCoursesCompleted || 0,
      hoursSpent: userProgress?.totalLearningTime ? Math.round(userProgress.totalLearningTime / 60) : 0,
      earnedCertificates: userProgress?.totalCertificatesEarned || 0,
    };

    return new Response(JSON.stringify(userProgressData), { status: 200 });
  }catch(error){
    return new Response(JSON.stringify({ message: "Server error", error: error.message }), { status: 500 });
  }
}
export async function PUT(req: NextRequest) {
  await connectDB();

  const body = await req.json();
  const { firstName, lastName, phone, location } = body;

  const session = await getSession();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { firstName, lastName, phone, location },
      { new: true }
    ).lean();

    if (!updatedUser) {
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: "Profile updated", user: updatedUser }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Server error", error: error.message }), { status: 500 });
  }
}