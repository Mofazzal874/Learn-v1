import { auth } from "@/auth";
import { unpublishCourse } from "@/app/actions/course";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "tutor") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await unpublishCourse(params.id);
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Error unpublishing course:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}