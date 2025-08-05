import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import connectDB from "@/lib/db";
import { Roadmap } from "@/models/Roadmap";
import mongoose from "mongoose";

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

    // Ensure the roadmap has suggestion fields (for backwards compatibility)
    if (!roadmap.suggestedCourse || !roadmap.suggestedVideos) {
      console.log(`[EXISTING_SUGGESTIONS] Adding missing suggestion fields to roadmap ${roadmapId}`);
      
      const updateFields: Record<string, unknown[]> = {};
      if (!roadmap.suggestedCourse) updateFields.suggestedCourse = [];
      if (!roadmap.suggestedVideos) updateFields.suggestedVideos = [];
      
      await Roadmap.updateOne(
        { _id: roadmapId },
        { $set: updateFields }
      );
      console.log(`[EXISTING_SUGGESTIONS] Added missing fields to roadmap ${roadmapId}`);
      
      // Get the updated roadmap
      const updatedRoadmap = await Roadmap.findById(roadmapId);
      if (updatedRoadmap) {
        roadmap.suggestedCourse = updatedRoadmap.suggestedCourse || [];
        roadmap.suggestedVideos = updatedRoadmap.suggestedVideos || [];
      }
    }

    // Filter suggestions for this specific node
    const existingCourses = (roadmap.suggestedCourse || [])
      .filter((suggestion: { nodeId: string; courseId: mongoose.Types.ObjectId; status: boolean }) => suggestion.nodeId === nodeId)
      .map((suggestion: { courseId: mongoose.Types.ObjectId; status: boolean }) => ({
        courseId: suggestion.courseId.toString(),
        status: suggestion.status
      }));

    const existingVideos = (roadmap.suggestedVideos || [])
      .filter((suggestion: { nodeId: string; videoId: mongoose.Types.ObjectId; status: boolean }) => suggestion.nodeId === nodeId)
      .map((suggestion: { videoId: mongoose.Types.ObjectId; status: boolean }) => ({
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