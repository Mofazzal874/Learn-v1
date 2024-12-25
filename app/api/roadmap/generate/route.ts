import { NextResponse } from "next/server";
import { generateRoadmap } from "@/lib/ai";
import { getSession } from "@/lib/getSession";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, level, roadmapType } = await req.json();

    if (!prompt || !level || !roadmapType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const nodes = await generateRoadmap(prompt, level, roadmapType);
    
    // Generate edges based on parent-child relationships
    const edges = nodes.flatMap(node =>
      node.children.map(childId => ({
        id: `${node.id}-${childId}`,
        source: node.id,
        target: childId,
        animated: true
      }))
    );

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    console.error("Error generating roadmap:", error);
    return NextResponse.json(
      { error: "Failed to generate roadmap" },
      { status: 500 }
    );
  }
} 