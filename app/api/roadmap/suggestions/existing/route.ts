import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import connectDB from "@/lib/db";
import { Roadmap } from "@/models/Roadmap";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { roadmapId, nodeId } = body;

    if (!roadmapId || !nodeId) {
      return NextResponse.json(
        { error: "roadmapId and nodeId are required" },
        { status: 400 }
      );
    }

    console.log(`[EXISTING_SUGGESTIONS] Getting suggestions for roadmap ${roadmapId}, node ${nodeId}`);

    // Find the roadmap
    const roadmap = await Roadmap.findOne({
      _id: roadmapId,
      userId: session.user.id
    });

    if (!roadmap) {
      return NextResponse.json(
        { error: "Roadmap not found" },
        { status: 404 }
      );
    }

    // Filter suggestions for this specific node
    const existingCourses = roadmap.suggestedCourse
      .filter((suggestion: any) => suggestion.nodeId === nodeId)
      .map((suggestion: any) => ({
        courseId: suggestion.courseId.toString(),
        status: suggestion.status
      }));

    const existingVideos = roadmap.suggestedVideos
      .filter((suggestion: any) => suggestion.nodeId === nodeId)
      .map((suggestion: any) => ({
        videoId: suggestion.videoId.toString(),
        status: suggestion.status
      }));

    console.log(`[EXISTING_SUGGESTIONS] Found ${existingCourses.length} courses and ${existingVideos.length} videos for node ${nodeId}`);

    return NextResponse.json({
      courses: existingCourses,
      videos: existingVideos
    });

  } catch (error: unknown) {
    console.error("[EXISTING_SUGGESTIONS] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch existing suggestions",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}