// lib/ai.ts
import axios from "axios";
import { RoadmapNode } from "@/types";

interface AIRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
}

export const generateRoadmap = async (
  prompt: string,
  level: "beginner" | "intermediate" | "advanced",
  roadmapType: "week-by-week" | "topic-wise"
) => {
  const aiPrompt = `
  Create a detailed ${roadmapType} learning roadmap for ${prompt} at a ${level} level.
  Format the response as a JSON array of nodes where each node has:
  - id (string)
  - title (string)
  - description (array of strings, bullet points about the topic)
  - children (array of node IDs)
  - timeNeeded (estimated hours to complete)
  
  Ensure the roadmap:
  - Is properly structured with clear progression
  - Has detailed descriptions for each topic
  - Includes practical exercises and projects
  - Has logical dependencies between topics
  `;

  try {
    const response = await axios.post(
      "https://api.groq.com/v1/completions",
      {
        model: "mixtral-8x7b-32768",
        prompt: aiPrompt,
        max_tokens: 4000,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
      }
    );

    const text = response.data.choices[0].text.trim();
    let roadmap = JSON.parse(text);

    // Process nodes to add required fields and positions
    const processedNodes: RoadmapNode[] = roadmap.map((node: any, index: number) => ({
      ...node,
      completed: false,
      position: calculateNodePosition(index, roadmap.length),
      timeConsumed: 0,
    }));

    return processedNodes;
  } catch (error) {
    console.error("Error generating roadmap:", error);
    throw new Error("Failed to generate roadmap");
  }
};

// Helper function to calculate node positions in a tree layout
function calculateNodePosition(index: number, total: number) {
  const VERTICAL_SPACING = 100;
  const HORIZONTAL_SPACING = 200;
  const nodesPerRow = Math.ceil(Math.sqrt(total));
  
  const row = Math.floor(index / nodesPerRow);
  const col = index % nodesPerRow;
  
  return {
    x: col * HORIZONTAL_SPACING,
    y: row * VERTICAL_SPACING
  };
}
