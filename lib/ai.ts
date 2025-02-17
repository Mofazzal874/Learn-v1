// lib/ai.ts
import axios from "axios";
import { RoadmapNode } from "@/types";

const invalidKeywords = [
  "weather", 
  "score",
  "news",
  "today",
  "current",
  "calculate",
  "what is",
  "who is",
  "where is",
  "when is",
  "why is",
  "how to fix",
  "debug",
  "error",
  "problem"
];

// Simplify the validation function
const validatePrompt = (prompt: string): boolean => {
  const lowerCasePrompt = prompt.toLowerCase().trim();
  
  // Check minimum length
  if (lowerCasePrompt.length < 3) {
    throw new Error("Please enter a longer topic description.");
  }

  // Check maximum length
  if (lowerCasePrompt.length > 200) {
    throw new Error("Please enter a shorter topic description.");
  }

  // Check for invalid keywords - only block obviously non-educational queries
  const matchedKeyword = invalidKeywords.find(keyword => lowerCasePrompt.includes(keyword));
  if (matchedKeyword) {
    throw new Error(`Please enter a topic you want to learn about, rather than a question or problem.`);
  }

  return true;
};

export const generateRoadmap = async (
  prompt: string,
  level: "beginner" | "intermediate" | "advanced",
  roadmapType: "week-by-week" | "topic-wise"
) => {
  console.log("Starting AI generation with:", { prompt, level, roadmapType });

  try {
    // Validate prompt before making API request
    validatePrompt(prompt);

    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured in environment variables");
    }

    const roadmapPrompt = `
You are an expert learning path designer specialized in creating structured educational roadmaps.

Task: Generate a comprehensive ${roadmapType} learning roadmap for "${prompt}" at a ${level} level.

IMPORTANT CONSTRAINTS:
1. Each node MUST have a maximum of 2 child nodes
2. Each node should connect to a maximum of 3 other nodes total (including parents and children)
3. Nodes MUST be numbered sequentially in learning order (1, 2, 3, etc.)
4. The node title should start with the sequence number (e.g., "1. Introduction to Python")

Guidelines for the roadmap:
1. Each node should represent a distinct learning objective
2. Maintain strict linear progression - each topic should build on previous ones
3. Include practical exercises and hands-on components
4. Break complex topics into smaller, manageable sub-topics
5. Time estimates should be realistic for ${level} level learners

Node Structure:
{
  "id": "node_1",  // Use sequential numbers in IDs
  "title": "1. Topic Title", // Must include sequence number
  "description": [
    "What you'll learn in this section",
    "Key concepts covered",
    "Practical applications"
  ],
  "children": ["node_2", "node_3"],  // Maximum 2 children
  "sequence": 1,  // Sequential order number
  "timeNeeded": integer_hours
}

Important:
- Strictly maintain sequential ordering
- Each node should connect to maximum 2-3 other nodes
- Ensure linear progression in learning path
- Root node must be sequence 1
- Keep dependencies simple and clear

Generate the roadmap JSON for: ${prompt}`;

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
            content: roadmapPrompt
          }
        ],
        temperature: 0.8,
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
    // Enhanced error handling
    const errorMessage = error.message || "Failed to generate roadmap";
    
    // Log error for debugging
    console.error("Roadmap generation error:", {
      message: errorMessage,
      prompt,
      level,
      roadmapType,
    });

    // Throw a user-friendly error
    throw new Error(
      error.response?.status === 401 ? "Authentication failed" :
      error.response?.status === 429 ? "Too many requests. Please try again later." :
      errorMessage
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
