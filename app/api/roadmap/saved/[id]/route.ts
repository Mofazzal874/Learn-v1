import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import connectDB, { mongoose } from "@/lib/db";
import { RoadmapNode, RoadmapEdge } from "@/types";

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
    
    console.log(`[GET_SAVED_ROADMAP] Successfully retrieved roadmap: ${roadmap.name}`);
    return NextResponse.json(roadmap);
  } catch (error: any) {
    console.error("[GET_SAVED_ROADMAP] Error:", error);
    return new NextResponse(JSON.stringify({ 
      error: "Failed to retrieve roadmap", 
      details: error.message || "Unknown error" 
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
        name,
        nodes: validatedNodes,
        edges: validatedEdges,
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    if (!updatedRoadmap) {
      console.log(`[UPDATE_SAVED_ROADMAP] Roadmap not found for ID: ${id}`);
      return new NextResponse(JSON.stringify({ error: "Roadmap not found or not owned by user" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`[UPDATE_SAVED_ROADMAP] Successfully updated roadmap: ${updatedRoadmap.name}`);
    return NextResponse.json({
      success: true,
      id: updatedRoadmap._id,
      name: updatedRoadmap.name,
      nodeCount: validatedNodes.length,
      edgeCount: validatedEdges.length
    });
  } catch (error: any) {
    console.error("[UPDATE_SAVED_ROADMAP] Error:", error);
    return new NextResponse(JSON.stringify({ 
      error: "Failed to update roadmap", 
      details: error.message || "Unknown error" 
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
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE_SAVED_ROADMAP] Error:", error);
    return new NextResponse(JSON.stringify({ 
      error: "Failed to delete roadmap", 
      details: error.message || "Unknown error" 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}