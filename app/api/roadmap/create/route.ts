import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Roadmap } from "@/models/Roadmap";
import { getSession } from "@/lib/getSession";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { nodes, edges, title, level, roadmapType } = await req.json();

    const roadmap = await Roadmap.create({
      userId: session.user.id,
      title,
      level,
      roadmapType,
      treeDirection: "top-down", // Default direction
      nodes,
      edges,
      suggestedCourse: [], // Initialize empty arrays for suggestions
      suggestedVideos: []
    });

    return NextResponse.json(roadmap);
  } catch (error) {
    console.error("Error creating roadmap:", error);
    return NextResponse.json(
      { error: "Failed to create roadmap" },
      { status: 500 }
    );
  }
}
