import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { getSession } from "@/lib/getSession";
import { User } from "@/models/User";
import { UserProgress } from "@/models/UserProgress";
import { Course } from "@/models/Course";


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

   const courses = await Course.find({tutorId:session.user.id}).lean();
   
   const totalStudents = courses.reduce((sum,course) => sum + (course.totalStudents || 0), 0 );

   const activeCourses = courses.filter(course => course.published && course.approved).length;

   let totalRating = 0;
   let coursesWithRatings = 0;

   courses.forEach(course => {
    if(course.rating && course.rating>0)
    {
        totalRating+=course.rating;
        coursesWithRatings++;
    }
   });

   const avgRating = coursesWithRatings > 0 ? (totalRating/coursesWithRatings).toFixed(1) : 0;

   const tutorStats = {
    user,
    totalStudents,
    activeCourses,
    avgRating
   }

    return new Response(JSON.stringify(tutorStats), { status: 200 });
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