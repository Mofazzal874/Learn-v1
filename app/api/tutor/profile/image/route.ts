import connectDB from "@/lib/db";
import { getSession } from "@/lib/getSession";
import { User } from "@/models/User";
import { writeFile } from "fs/promises";
import { NextRequest } from "next/server";
import path from "path";

export async function POST(req: NextRequest) {
  await connectDB();
  const session = await getSession();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  const formData = await req.formData();
  const file = formData.get("image");
  if (!file || typeof file === "string") {
    return new Response(JSON.stringify({ message: "No image uploaded" }), {
      status: 400,
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${session.user.id}_${Date.now()}.jpg`;
  const filePath = path.join(process.cwd(), "public","tutor", "uploads", filename);
  await writeFile(filePath, buffer);

  // Update user image path in DB
  const imageUrl = `/tutor/uploads/${filename}`;
  await User.findByIdAndUpdate(session.user.id, { image: imageUrl });

  return new Response(
    JSON.stringify({ message: "Image uploaded", image: imageUrl }),
    { status: 200 }
  );
}
