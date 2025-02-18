import { NextResponse } from "next/server";
import { generateRoadmap } from "@/lib/ai";
import { getSession } from "@/lib/getSession";
import { RoadmapNode, RoadmapEdge } from "@/types";

export async function POST(req: Request) {
  try {
    console.log("Starting roadmap generation request");

    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, level, roadmapType } = body;

    if (!prompt || !level || !roadmapType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate nodes using AI
    const nodes = await generateRoadmap(prompt, level, roadmapType);

    // Generate edges based on children relationships
    const edges: RoadmapEdge[] = nodes.flatMap(node =>
      node.children.map(childId => ({
        id: `${node.id}-${childId}`,
        source: node.id,
        target: childId,
        animated: true,
        type: 'smoothstep'
      }))
    );

    return NextResponse.json({ 
      nodes, 
      edges 
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate roadmap" },
      { status: error.response?.status || 500 }
    );
  }
} 