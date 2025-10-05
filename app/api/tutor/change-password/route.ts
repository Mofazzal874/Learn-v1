import connectDB from "@/lib/db";
import { getSession } from "@/lib/getSession";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  await connectDB();
  const session = await getSession();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  const { currentPassword, newPassword } = await req.json();
  const user = await User.findById(session.user.id).select("+password");
  if (!user) {
    return new Response(JSON.stringify({ message: "User not found" }), {
      status: 404,
    });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return new Response(
      JSON.stringify({ message: "Current password is incorrect" }),
      { status: 400 }
    );
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return new Response(
    JSON.stringify({ message: "Password changed successfully" }),
    { status: 200 }
  );
}
