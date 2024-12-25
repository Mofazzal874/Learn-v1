// lib/ai.ts
import axios from "axios";
import { RoadmapNode } from "@/types";

export const generateRoadmap = async (
  prompt: string,
  level: "beginner" | "intermediate" | "advanced",
  roadmapType: "week-by-week" | "topic-wise"
) => {
  console.log("Starting AI generation with:", { prompt, level, roadmapType });

  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured in environment variables");
  }

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
    console.log("Making request to Groq API");
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI that creates structured learning roadmaps."
          },
          {
            role: "user",
            content: aiPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        }
      }
    );

    console.log("Received response from Groq API");

    if (!response.data?.choices?.[0]?.message?.content) {
      console.error("Invalid API response:", response.data);
      throw new Error("Invalid response from Groq API");
    }

    const text = response.data.choices[0].message.content.trim();
    console.log("Raw AI response:", text);

    let roadmap;
    try {
      roadmap = JSON.parse(text);
    } catch (e) {
      console.error("JSON parse error:", e);
      console.error("Raw text that failed to parse:", text);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Process nodes to add required fields and positions
    const processedNodes: RoadmapNode[] = roadmap.map((node: any, index: number) => ({
      ...node,
      completed: false,
      position: calculateNodePosition(index, roadmap.length),
      timeConsumed: 0,
    }));

    console.log("Processed nodes:", processedNodes);
    return processedNodes;
  } catch (error: any) {
    console.error("AI Generation error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    if (error.response?.status === 401) {
      throw new Error("Invalid API key or authentication failed");
    }
    
    if (error.response?.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    
    throw new Error(
      error.message || 
      error.response?.data?.error?.message || 
      "Failed to generate roadmap"
    );
  }
};

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
