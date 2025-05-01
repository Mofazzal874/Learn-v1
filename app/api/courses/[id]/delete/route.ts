import { auth } from "@/auth";
import { deleteCourse } from "@/app/actions/course";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "tutor") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await deleteCourse(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting course:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}