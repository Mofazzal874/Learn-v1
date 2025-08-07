import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import connectDB from "@/lib/db";
import { RoadmapNode, RoadmapEdge } from "@/types";
import { processRoadmapEmbedding } from "@/lib/embedding";
import { Roadmap } from "@/models/Roadmap";

// Helper function to validate node data
const validateNode = (node: any): boolean => {
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
const validateEdge = (edge: any): boolean => {
  if (!edge || typeof edge !== 'object') return false;
  if (!edge.id || typeof edge.id !== 'string') return false;
  if (!edge.source || typeof edge.source !== 'string') return false;
  if (!edge.target || typeof edge.target !== 'string') return false;
  
  return true;
};

export async function POST(req: Request) {
  console.log("[SAVE_ROADMAP] Starting save request");
  
  try {
    // Connect to the database first
    await connectDB();
    console.log("[SAVE_ROADMAP] Database connected");
    
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      console.log("[SAVE_ROADMAP] Unauthorized access - no session or user ID");
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.log(`[SAVE_ROADMAP] User authenticated: ${session.user.id}`);
    
    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("[SAVE_ROADMAP] Request body parsed", { 
        name: body.name,
        nodesCount: body.nodes?.length,
        edgesCount: body.edges?.length
      });
    } catch (error) {
      console.error("[SAVE_ROADMAP] Error parsing request body:", error);
      return new NextResponse("Invalid request body", { status: 400 });
    }
    
    const { name, nodes, edges } = body;

    // Validate required fields
    if (!name || !nodes || !edges) {
      console.log("[SAVE_ROADMAP] Missing required fields", { 
        name: !!name, 
        nodes: !!nodes, 
        edges: !!edges 
      });
      return new NextResponse("Missing required fields", { status: 400 });
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
      console.log("[SAVE_ROADMAP] Invalid data detected", {
        invalidNodeCount: invalidNodes.length,
        invalidEdgeCount: invalidEdges.length
      });
      console.log("Invalid nodes:", invalidNodes.slice(0, 3));
      console.log("Invalid edges:", invalidEdges.slice(0, 3));
    }
    
    if (validatedNodes.length === 0) {
      return new NextResponse(JSON.stringify({
        error: "No valid nodes provided"
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create the document using the proper Roadmap model
    console.log(`[SAVE_ROADMAP] Creating roadmap "${name}" for user ${session.user.id} with ${validatedNodes.length} nodes and ${validatedEdges.length} edges`);
    const roadmap = await Roadmap.create({
      userId: session.user.id,
      title: name, // Use 'title' instead of 'name' to match the schema
      level: "beginner", // Default level - you might want to get this from the request
      roadmapType: "topic-wise", // Default type - you might want to get this from the request
      treeDirection: "top-down", // Default direction
      nodes: validatedNodes,
      edges: validatedEdges,
      suggestedCourse: [], // Initialize empty arrays for suggestions
      suggestedVideos: []
    });

    console.log(`[SAVE_ROADMAP] Roadmap saved successfully with ID: ${roadmap._id}`);
    
    // Process embeddings asynchronously - don't wait for completion
    processEmbeddingsAsync(roadmap, session.user.id);
    
    return NextResponse.json({ 
      success: true, 
      id: roadmap._id, 
      name: roadmap.title, // Use 'title' since that's what we saved
      nodeCount: validatedNodes.length,
      edgeCount: validatedEdges.length,
      embeddingStatus: "processing"
    });
    
  } catch (error: any) {
    console.error("[SAVE_ROADMAP] Error saving roadmap:", error);
    // Return more detailed error for debugging
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to save roadmap", 
        details: error.message || "Unknown error" 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Async function to process embeddings without blocking the response
async function processEmbeddingsAsync(roadmap: any, userId: string) {
  try {
    console.log(`[SAVE_ROADMAP] Starting async embedding processing for roadmap ${roadmap._id}`);
    
    // Convert the mongoose document to a plain object that matches IRoadmap interface
    const roadmapData = {
      _id: roadmap._id,
      title: roadmap.title, // Now using the correct field name
      level: roadmap.level || "beginner",
      roadmapType: roadmap.roadmapType || "topic-wise",
      nodes: roadmap.nodes || [],
      edges: roadmap.edges || [],
      userId: roadmap.userId,
      createdAt: roadmap.createdAt,
      updatedAt: roadmap.updatedAt
    };
    
    await processRoadmapEmbedding(roadmapData, userId);
    console.log(`[SAVE_ROADMAP] Embedding processing completed for roadmap ${roadmap._id}`);
  } catch (error) {
    console.error(`[SAVE_ROADMAP] Embedding processing failed for roadmap ${roadmap._id}:`, error);
    // Don't throw - this is async and shouldn't affect the main save operation
  }
} 