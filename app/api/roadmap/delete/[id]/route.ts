import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Roadmap } from "@/models/Roadmap";
import { getSession } from "@/lib/getSession";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    
    const roadmap = await Roadmap.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!roadmap) {
      return NextResponse.json(
        { error: "Roadmap not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Roadmap deleted successfully" });
  } catch (error) {
    console.error("Error deleting roadmap:", error);
    return NextResponse.json(
      { error: "Failed to delete roadmap" },
      { status: 500 }
    );
  }
} 