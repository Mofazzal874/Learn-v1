import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { getSession } from "@/lib/getSession";
import { User } from "@/models/User";

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