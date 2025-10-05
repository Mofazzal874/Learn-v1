import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import connectDB, { mongoose } from "@/lib/db";
import { processRoadmapEmbedding, deleteRoadmapEmbedding } from "@/lib/embedding";
import { Roadmap } from "@/models/Roadmap";

// Helper function to validate node data
const validateNode = (node: Record<string, unknown>): boolean => {
  if (!node || typeof node !== 'object') return false;
  if (!node.id || typeof node.id !== 'string') return false;
  
  // Title must be a string or convertible to string
  node.title = String(node.title || '');
  
  // Ensure other properties have default values if missing
  node.description = node.description || [];
  node.children = Array.isArray(node.children) ? node.children : [];
  node.position = node.position || { x: 0, y: 0 };
  
  return true;
};

// Helper function to validate edge data
const validateEdge = (edge: Record<string, unknown>): boolean => {
  if (!edge || typeof edge !== 'object') return false;
  if (!edge.id || typeof edge.id !== 'string') return false;
  if (!edge.source || typeof edge.source !== 'string') return false;
  if (!edge.target || typeof edge.target !== 'string') return false;
  
  return true;
};

export async function GET(req: Request) {
  try {
    // Connect to the database first
    await connectDB();
    
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    console.log("[GET_SAVED_ROADMAP] Starting request for roadmap ID:", id);
    // Validate ID
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      console.log("[GET_SAVED_ROADMAP] Invalid roadmap ID:", id);
      return new NextResponse(JSON.stringify({ error: "Invalid roadmap ID" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      console.log("[GET_SAVED_ROADMAP] Unauthorized access - no session or user ID");
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Find the roadmap
    console.log(`[GET_SAVED_ROADMAP] Finding roadmap ${id} for user ${session.user.id}`);
    const roadmap = await Roadmap.findOne({
      _id: id,
      userId: session.user.id,
    });
    
    if (!roadmap) {
      console.log(`[GET_SAVED_ROADMAP] Roadmap not found for ID: ${id}`);
      return new NextResponse(JSON.stringify({ error: "Roadmap not found" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Ensure suggestion arrays exist (for backwards compatibility)
    let needsSave = false;
    if (!roadmap.suggestedCourse) {
      roadmap.suggestedCourse = [];
      needsSave = true;
    }
    if (!roadmap.suggestedVideos) {
      roadmap.suggestedVideos = [];
      needsSave = true;
    }
    if (needsSave) {
      await roadmap.save();
    }
    
    console.log(`[GET_SAVED_ROADMAP] Successfully retrieved roadmap: ${roadmap.title || roadmap.name}`);
    
    // Transform response to ensure frontend compatibility
    const responseData = {
      ...roadmap.toObject(),
      name: roadmap.title || roadmap.name, // Ensure 'name' field exists for frontend
      title: roadmap.title || roadmap.name // Keep title for consistency
    };
    
    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error("[GET_SAVED_ROADMAP] Error:", error);
    return new NextResponse(JSON.stringify({ 
      error: "Failed to retrieve roadmap", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(req: Request) {
  try {
    // Connect to the database first
    await connectDB();
    
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    console.log("[UPDATE_SAVED_ROADMAP] Starting request for roadmap ID:", id);
    // Validate ID
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      console.log("[UPDATE_SAVED_ROADMAP] Invalid roadmap ID:", id);
      return new NextResponse(JSON.stringify({ error: "Invalid roadmap ID" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      console.log("[UPDATE_SAVED_ROADMAP] Unauthorized access - no session or user ID");
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("[UPDATE_SAVED_ROADMAP] Request body parsed", { 
        name: body.name,
        nodesCount: body.nodes?.length,
        edgesCount: body.edges?.length
      });
    } catch (error) {
      console.error("[UPDATE_SAVED_ROADMAP] Error parsing request body:", error);
      return new NextResponse(JSON.stringify({ error: "Invalid request body" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { name, nodes, edges } = body;

    // Validate required fields
    if (!name || !nodes || !edges) {
      console.log("[UPDATE_SAVED_ROADMAP] Missing required fields", { 
        name: !!name, 
        nodes: !!nodes, 
        edges: !!edges 
      });
      return new NextResponse(JSON.stringify({ error: "Missing required fields" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate nodes and edges
    const validatedNodes = [];
    const invalidNodes = [];
    
    for (const node of nodes) {
      if (validateNode(node)) {
        validatedNodes.push(node);
      } else {
        invalidNodes.push(node);
      }
    }
    
    const validatedEdges = [];
    const invalidEdges = [];
    
    for (const edge of edges) {
      if (validateEdge(edge)) {
        validatedEdges.push(edge);
      } else {
        invalidEdges.push(edge);
      }
    }
    
    if (invalidNodes.length > 0 || invalidEdges.length > 0) {
      console.log("[UPDATE_SAVED_ROADMAP] Invalid data detected", {
        invalidNodeCount: invalidNodes.length,
        invalidEdgeCount: invalidEdges.length
      });
      console.log("First few invalid nodes:", invalidNodes.slice(0, 3));
      console.log("First few invalid edges:", invalidEdges.slice(0, 3));
    }
    
    if (validatedNodes.length === 0) {
      return new NextResponse(JSON.stringify({
        error: "No valid nodes provided"
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Find and update the roadmap
    console.log(`[UPDATE_SAVED_ROADMAP] Updating roadmap ${id} for user ${session.user.id}`);
    const updatedRoadmap = await Roadmap.findOneAndUpdate(
      {
        _id: id,
        userId: session.user.id,
      },
      {
        title: name, // Use 'title' to match the proper schema
        nodes: validatedNodes,
        edges: validatedEdges,
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    // Ensure suggestion arrays exist after update (for backwards compatibility)
    if (updatedRoadmap) {
      let needsSave = false;
      if (!updatedRoadmap.suggestedCourse) {
        updatedRoadmap.suggestedCourse = [];
        needsSave = true;
      }
      if (!updatedRoadmap.suggestedVideos) {
        updatedRoadmap.suggestedVideos = [];
        needsSave = true;
      }
      if (needsSave) {
        await updatedRoadmap.save();
      }
    }
    
    if (!updatedRoadmap) {
      console.log(`[UPDATE_SAVED_ROADMAP] Roadmap not found for ID: ${id}`);
      return new NextResponse(JSON.stringify({ error: "Roadmap not found or not owned by user" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`[UPDATE_SAVED_ROADMAP] Successfully updated roadmap: ${updatedRoadmap.title}`);
    
    // Process embeddings asynchronously for the update
    processEmbeddingsAsync(updatedRoadmap, session.user.id);
    
    return NextResponse.json({
      success: true,
      id: updatedRoadmap._id,
      name: updatedRoadmap.title, // Return as 'name' for frontend compatibility
      nodeCount: validatedNodes.length,
      edgeCount: validatedEdges.length,
      embeddingStatus: "processing"
    });
  } catch (error: unknown) {
    console.error("[UPDATE_SAVED_ROADMAP] Error:", error);
    return new NextResponse(JSON.stringify({ 
      error: "Failed to update roadmap", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(req: Request) {
  try {
    // Connect to the database first
    await connectDB();
    
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    console.log("[DELETE_SAVED_ROADMAP] Starting request for roadmap ID:", id);
    // Validate ID
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      console.log("[DELETE_SAVED_ROADMAP] Invalid roadmap ID:", id);
      return new NextResponse(JSON.stringify({ error: "Invalid roadmap ID" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      console.log("[DELETE_SAVED_ROADMAP] Unauthorized access - no session or user ID");
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Delete the roadmap
    console.log(`[DELETE_SAVED_ROADMAP] Deleting roadmap ${id} for user ${session.user.id}`);
    const result = await Roadmap.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });
    
    if (!result) {
      console.log(`[DELETE_SAVED_ROADMAP] Roadmap not found for ID: ${id}`);
      return new NextResponse(JSON.stringify({ error: "Roadmap not found or not owned by user" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`[DELETE_SAVED_ROADMAP] Successfully deleted roadmap: ${result.name}`);
    
    // Clean up embeddings asynchronously (don't wait for completion)
    deleteEmbeddingsAsync(id, session.user.id);
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[DELETE_SAVED_ROADMAP] Error:", error);
    return new NextResponse(JSON.stringify({ 
      error: "Failed to delete roadmap", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Async function to process embeddings without blocking the response
async function processEmbeddingsAsync(roadmap: Record<string, unknown>, userId: string) {
  try {
    console.log(`[UPDATE_SAVED_ROADMAP] Starting async embedding processing for roadmap ${roadmap._id}`);
    
    // Convert the mongoose document to a plain object that matches IRoadmap interface
    const roadmapData = {
      _id: roadmap._id,
      title: roadmap.title, // Now using the correct field name
      level: roadmap.level || "beginner", // Provide default if not available
      roadmapType: roadmap.roadmapType || "topic-wise", // Provide default if not available
      nodes: roadmap.nodes || [],
      edges: roadmap.edges || [],
      userId: roadmap.userId,
      createdAt: roadmap.createdAt,
      updatedAt: roadmap.updatedAt
    };
    
    await processRoadmapEmbedding(roadmapData, userId);
    console.log(`[UPDATE_SAVED_ROADMAP] Embedding processing completed for roadmap ${roadmap._id}`);
  } catch (error: unknown) {
    console.error(`[UPDATE_SAVED_ROADMAP] Embedding processing failed for roadmap ${roadmap._id}:`, error);
    // Don't throw - this is async and shouldn't affect the main save operation
  }
}

// Async function to clean up embeddings when roadmap is deleted
async function deleteEmbeddingsAsync(roadmapId: string, userId: string) {
  try {
    console.log(`[DELETE_SAVED_ROADMAP] Starting async embedding cleanup for roadmap ${roadmapId}`);
    await deleteRoadmapEmbedding(roadmapId, userId);
    console.log(`[DELETE_SAVED_ROADMAP] Embedding cleanup completed for roadmap ${roadmapId}`);
  } catch (error) {
    console.error(`[DELETE_SAVED_ROADMAP] Embedding cleanup failed for roadmap ${roadmapId}:`, error);
    // Don't throw - this is async cleanup
  }
}