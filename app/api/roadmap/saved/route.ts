import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import connectDB from "@/lib/db";
import { processRoadmapEmbedding } from "@/lib/embedding";
import { Roadmap } from "@/models/Roadmap";
import mongoose from "mongoose";

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

export async function GET() {
  console.log("[ROADMAP_SAVED] Starting GET request");
  try {
    // Establish database connection first
    await connectDB();
    console.log("[ROADMAP_SAVED] Database connected");
    
    const session = await getSession();
    if (!session?.user?.id) {
      console.log("[ROADMAP_SAVED] Unauthorized - no user session");
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    console.log(`[ROADMAP_SAVED] Fetching roadmaps for user ${session.user.id}`);
    const roadmaps = await Roadmap.find({
      userId: session.user.id,
    }).sort({ updatedAt: -1 });
    
    console.log(`[ROADMAP_SAVED] Found ${roadmaps.length} roadmaps`);
    
    // Transform roadmaps to ensure frontend compatibility
    const transformedRoadmaps = roadmaps.map(roadmap => ({
      ...roadmap.toObject(),
      name: roadmap.title || roadmap.name, // Ensure 'name' field exists for frontend
      title: roadmap.title || roadmap.name // Keep title for consistency
    }));
    
    return NextResponse.json(transformedRoadmaps);
  } catch (error) {
    console.error("[ROADMAP_SAVED] Error:", error);
    return new NextResponse(JSON.stringify({
      error: "Failed to fetch roadmaps",
      details: error instanceof Error ? error.message : "Unknown error"
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function POST(req: Request) {
  console.log("[ROADMAP_SAVED] Starting POST request to create new roadmap");
  try {
    // Establish database connection first
    await connectDB();
    console.log("[ROADMAP_SAVED] Database connected");
    
    const session = await getSession();
    if (!session?.user?.id) {
      console.log("[ROADMAP_SAVED] Unauthorized - no user session");
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("[ROADMAP_SAVED] Request body parsed", { 
        name: body.name,
        nodesCount: body.nodes?.length,
        edgesCount: body.edges?.length
      });
    } catch (error) {
      console.error("[ROADMAP_SAVED] Error parsing request body:", error);
      return new NextResponse(JSON.stringify({ error: "Invalid request body" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const { name, nodes, edges } = body;

    // Validate required fields
    if (!name || !nodes || !edges) {
      console.log("[ROADMAP_SAVED] Missing required fields", { 
        name: !!name, 
        nodes: !!nodes, 
        edges: !!edges 
      });
      return new NextResponse(JSON.stringify({ error: "Missing required fields" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
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
      console.log("[ROADMAP_SAVED] Invalid data detected", {
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
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Create new roadmap
    console.log(`[ROADMAP_SAVED] Creating roadmap "${name}" for user ${session.user.id}`);
    
    const roadmapData = {
      userId: session.user.id,
      title: name, // Use 'title' to match the schema
      level: "beginner", // Default level
      roadmapType: "topic-wise", // Default type
      treeDirection: "top-down", // Default direction
      nodes: validatedNodes,
      edges: validatedEdges,
      suggestedCourse: [], // Initialize empty arrays for suggestions
      suggestedVideos: []
    };
    
    const roadmap = await Roadmap.create(roadmapData);
    console.log(`[ROADMAP_SAVED] Successfully created roadmap with ID: ${roadmap._id}`);
    
    // Process embeddings asynchronously - don't wait for completion
    processEmbeddingsAsync(roadmap, session.user.id);
    
    return NextResponse.json({
      success: true,
      id: roadmap._id,
      name: roadmap.title, // Use title since that's what we saved
      embeddingStatus: "processing"
    });
  } catch (error) {
    console.error("[ROADMAP_SAVED] Error:", error);
    return new NextResponse(JSON.stringify({
      error: "Failed to create roadmap",
      details: error instanceof Error ? error.message : "Unknown error"
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Async function to process embeddings without blocking the response
async function processEmbeddingsAsync(roadmap: Record<string, unknown>, userId: string) {
  try {
    console.log(`[ROADMAP_SAVED] Starting async embedding processing for roadmap ${roadmap._id}`);
    
    // Convert the mongoose document to a plain object that matches IRoadmap interface
    const roadmapData = {
      _id: roadmap._id,
      title: roadmap.title, // Use 'title' since that's what we save now
      level: roadmap.level || "beginner", // Provide default if not available
      roadmapType: roadmap.roadmapType || "topic-wise", // Provide default if not available
      nodes: roadmap.nodes || [],
      edges: roadmap.edges || [],
      userId: roadmap.userId,
      createdAt: roadmap.createdAt,
      updatedAt: roadmap.updatedAt
    };
    
    await processRoadmapEmbedding(roadmapData, userId);
    console.log(`[ROADMAP_SAVED] Embedding processing completed for roadmap ${roadmap._id}`);
  } catch (error) {
    console.error(`[ROADMAP_SAVED] Embedding processing failed for roadmap ${roadmap._id}:`, error);
    // Don't throw - this is async and shouldn't affect the main save operation
  }
} 