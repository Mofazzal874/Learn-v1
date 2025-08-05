import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Roadmap } from "@/models/Roadmap";
import { getSession } from "@/lib/getSession";
import { processRoadmapEmbedding } from "@/lib/embedding";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { nodes, edges } = await req.json();
    const { id } = params;

    const roadmap = await Roadmap.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: { nodes, edges } },
      { new: true }
    );

    if (!roadmap) {
      return NextResponse.json(
        { error: "Roadmap not found" },
        { status: 404 }
      );
    }

    // Process embeddings asynchronously - don't wait for completion
    processEmbeddingsAsync(roadmap, session.user.id);

    return NextResponse.json(roadmap);
  } catch (error) {
    console.error("Error updating roadmap:", error);
    return NextResponse.json(
      { error: "Failed to update roadmap" },
      { status: 500 }
    );
  }
}

// Async function to process embeddings without blocking the response
async function processEmbeddingsAsync(roadmap: any, userId: string) {
  try {
    console.log(`[UPDATE_ROADMAP] Starting async embedding processing for roadmap ${roadmap._id}`);
    
    // Convert the mongoose document to a plain object that matches IRoadmap interface
    const roadmapData = {
      _id: roadmap._id,
      title: roadmap.title,
      level: roadmap.level || "beginner",
      roadmapType: roadmap.roadmapType || "topic-wise",
      nodes: roadmap.nodes || [],
      edges: roadmap.edges || [],
      userId: roadmap.userId,
      createdAt: roadmap.createdAt,
      updatedAt: roadmap.updatedAt
    };
    
    await processRoadmapEmbedding(roadmapData, userId);
    console.log(`[UPDATE_ROADMAP] Embedding processing completed for roadmap ${roadmap._id}`);
  } catch (error) {
    console.error(`[UPDATE_ROADMAP] Embedding processing failed for roadmap ${roadmap._id}:`, error);
    // Don't throw - this is async and shouldn't affect the main update operation
  }
} 