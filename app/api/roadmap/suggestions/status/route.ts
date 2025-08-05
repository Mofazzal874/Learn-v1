import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import connectDB from "@/lib/db";
import { Roadmap } from "@/models/Roadmap";
import mongoose from "mongoose";

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { roadmapId, nodeId, suggestionType, suggestionId, status } = body;

    // Validate required fields
    if (!roadmapId || !nodeId || !suggestionType || !suggestionId || typeof status !== 'boolean') {
      return NextResponse.json(
        { error: "Missing required fields: roadmapId, nodeId, suggestionType, suggestionId, status" },
        { status: 400 }
      );
    }

    if (!['course', 'video'].includes(suggestionType)) {
      return NextResponse.json(
        { error: "suggestionType must be 'course' or 'video'" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return NextResponse.json(
        { error: "Invalid roadmap ID" },
        { status: 400 }
      );
    }

    console.log(`[SUGGESTION_STATUS] Updating ${suggestionType} suggestion status:`, {
      roadmapId,
      nodeId,
      suggestionId,
      status
    });

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

    // Determine which array to update
    const arrayField = suggestionType === 'course' ? 'suggestedCourse' : 'suggestedVideos';
    const idField = suggestionType === 'course' ? 'courseId' : 'videoId';

    // Find existing suggestion
    const existingSuggestionIndex = roadmap[arrayField].findIndex(
      (item: any) => item[idField].toString() === suggestionId && item.nodeId === nodeId
    );

    if (existingSuggestionIndex !== -1) {
      // Update existing suggestion
      roadmap[arrayField][existingSuggestionIndex].status = status;
      console.log(`[SUGGESTION_STATUS] Updated existing ${suggestionType} suggestion`);
    } else {
      // Add new suggestion
      roadmap[arrayField].push({
        [idField]: new mongoose.Types.ObjectId(suggestionId),
        nodeId,
        status
      });
      console.log(`[SUGGESTION_STATUS] Added new ${suggestionType} suggestion`);
    }

    // Save the roadmap
    await roadmap.save();

    console.log(`[SUGGESTION_STATUS] Successfully updated ${suggestionType} suggestion status`);

    return NextResponse.json({
      success: true,
      message: `${suggestionType} suggestion status updated successfully`
    });

  } catch (error: unknown) {
    console.error("[SUGGESTION_STATUS] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to update suggestion status",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}