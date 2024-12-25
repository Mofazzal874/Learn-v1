import { NextResponse } from "next/server";
import { generateRoadmap } from "@/lib/ai";
import { getSession } from "@/lib/getSession";
import { RoadmapNode, RoadmapEdge } from "@/types";

export async function POST(req: Request) {
  try {
    console.log("Starting roadmap generation request");

    const session = await getSession();
    console.log("Session:", session);

    if (!session?.user) {
      console.log("Unauthorized: No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Request body:", body);
    
    const { prompt, level, roadmapType } = body;

    if (!prompt || !level || !roadmapType) {
      console.log("Missing fields:", { prompt, level, roadmapType });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate nodes using AI
    const nodes = await generateRoadmap(prompt, level, roadmapType);

    // Generate edges based on parent-child relationships
    const edges: RoadmapEdge[] = nodes.flatMap(node =>
      node.children.map(childId => ({
        id: `${node.id}-${childId}`,
        source: node.id,
        target: childId,
        animated: true
      }))
    );

    return NextResponse.json({ nodes, edges });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate roadmap" },
      { status: 500 }
    );
  }
} 