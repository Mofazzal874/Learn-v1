import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import connectDB, { mongoose } from "@/lib/db";

// Define the Roadmap schema
const RoadmapSchema = new mongoose.Schema({
  name: String,
  userId: String,
  nodes: [Object],
  edges: [Object],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Get or create the Roadmap model
const Roadmap = mongoose.models.Roadmap || mongoose.model('Roadmap', RoadmapSchema);

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
    return NextResponse.json(roadmaps);
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
    
    for (let node of nodes) {
      if (validateNode(node)) {
        validatedNodes.push(node);
      } else {
        invalidNodes.push(node);
      }
    }
    
    const validatedEdges = [];
    const invalidEdges = [];
    
    for (let edge of edges) {
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
    const roadmap = await Roadmap.create({
      name,
      userId: session.user.id,
      nodes: validatedNodes,
      edges: validatedEdges,
    });
    
    console.log(`[ROADMAP_SAVED] Successfully created roadmap with ID: ${roadmap._id}`);
    return NextResponse.json({
      success: true,
      id: roadmap._id,
      name: roadmap.name,
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