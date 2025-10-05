import { NextResponse } from "next/server";
import { generateRoadmap } from "@/lib/ai";
import { getSession } from "@/lib/getSession";
import { RoadmapNode, RoadmapEdge } from "@/types";
import connectDB from "@/lib/db";
import { UserProgress } from "@/models/UserProgress";

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    console.log("Starting roadmap generation request");

    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { prompt, level, roadmapType } = body;

    console.log("Request parameters:", { prompt, level, roadmapType });

    if (!prompt || !level || !roadmapType) {
      const missingFields = [];
      if (!prompt) missingFields.push("prompt");
      if (!level) missingFields.push("level");
      if (!roadmapType) missingFields.push("roadmapType");
      
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate input types
    if (typeof prompt !== "string" || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: "Prompt must be a string with at least 3 characters" },
        { status: 400 }
      );
    }

    if (!["beginner", "intermediate", "advanced"].includes(level)) {
      return NextResponse.json(
        { error: "Level must be one of: beginner, intermediate, advanced" },
        { status: 400 }
      );
    }

    if (!["week-by-week", "topic-wise"].includes(roadmapType)) {
      return NextResponse.json(
        { error: "Roadmap type must be one of: week-by-week, topic-wise" },
        { status: 400 }
      );
    }

    console.log("Starting AI generation...");

    // Fetch user skills from UserProgress
    let userSkills: string[] = [];
    try {
      await connectDB();
      const userProgress = await UserProgress.findOne({ userId: session.user.id });
      if (userProgress && userProgress.skills && userProgress.skills.length > 0) {
        userSkills = userProgress.skills.map((skill: any) => skill.name);
        console.log("User skills found:", userSkills);
      } else {
        console.log("No user skills found");
      }
    } catch (error) {
      console.error("Error fetching user skills:", error);
      // Continue without skills if there's an error
    }

    // Generate nodes using AI (with user skills)
    const nodes = await generateRoadmap(prompt, level, roadmapType, userSkills);

    if (!nodes || nodes.length === 0) {
      console.error("Empty nodes array returned from generateRoadmap");
      return NextResponse.json(
        { error: "Failed to generate roadmap nodes" },
        { status: 500 }
      );
    }

    console.log(`Generated ${nodes.length} nodes successfully`);

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

    console.log(`Generated ${edges.length} edges`);
    const processingTime = Date.now() - startTime;
    console.log(`Total processing time: ${processingTime}ms`);

    return NextResponse.json({ 
      nodes, 
      edges 
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error("API Error:", error);
    console.error(`Failed after ${processingTime}ms`);
    
    // Determine appropriate status code based on error type
    let statusCode = 500;
    let errorMessage = error.message || "Failed to generate roadmap";
    
    if (errorMessage.includes("Missing required fields")) {
      statusCode = 400;
    } else if (errorMessage.includes("Authentication failed") || errorMessage.includes("Unauthorized")) {
      statusCode = 401;
    } else if (errorMessage.includes("Too many requests")) {
      statusCode = 429;
    } else if (error.response?.status) {
      statusCode = error.response.status;
      // Add more info if available
      if (error.response.data?.error) {
        errorMessage = `${errorMessage}: ${error.response.data.error}`;
      }
    }
    
    console.error(`Returning error response with status ${statusCode}: ${errorMessage}`);
    
    // Use a more friendly error message for users
    const userErrorMessage = statusCode === 400 
      ? "There was an issue with the roadmap request. Please try with a different topic or check your parameters."
      : errorMessage;
    
    return NextResponse.json(
      { 
        error: userErrorMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: statusCode }
    );
  }
} 