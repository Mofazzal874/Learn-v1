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
You are an expert JSON generator for learning roadmaps.
CRITICAL: You must return a JSON array of nodes, wrapped in { "nodes": [...] }

Required format:
{
  "nodes": [
    {
      "id": "node_1",
      "title": "1. First Topic",
      "description": ["Point 1", "Point 2", "Point 3"],
      "children": ["node_2", "node_3"],
      "sequence": 1,
      "timeNeeded": 4
    }
  ]
}

Rules:
1. Response must be a JSON object with a "nodes" array
2. Each node must have ALL these fields: id, title, description, children, sequence, timeNeeded
3. Title must start with sequence number (e.g., "1. Topic")
4. Description must be an array of 2-3 strings
5. Children must be an array of node IDs
6. Maximum 2 child nodes per node
7. Sequence must start at 1 and increment
8. Generate 12-15 nodes in range  for ${level} level ${prompt}
9. Maintain binary tree structure
10. Ensure proper learning progression

Generate for: ${prompt}`;

    // Update the system message to be more strict
    const systemMessage = `You are a JSON generator that ONLY outputs valid JSON arrays. 
Never include explanatory text. 
Never include markdown formatting. 
Always start with '[' and end with ']'.`;

    console.log("Making request to Groq API");
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: systemMessage
          },
          {
            role: "user",
            content: roadmapPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 4000,
        response_format: { type: "json_object" }  // Force JSON response
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

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
    } catch (e) {
      throw new Error("Failed to parse JSON response");
    }

    // Ensure we have a nodes array
    if (!parsedResponse.nodes || !Array.isArray(parsedResponse.nodes)) {
      throw new Error("Invalid response format: missing nodes array");
    }

    const roadmap = parsedResponse.nodes;

    // Process and validate each node
    const processedNodes: RoadmapNode[] = roadmap.map((node: any, index: number) => {
      // Validate required fields
      if (!node.id || !node.title || !Array.isArray(node.description) || 
          !Array.isArray(node.children) || typeof node.sequence !== 'number' || 
          typeof node.timeNeeded !== 'number') {
        throw new Error(`Invalid node format at position ${index + 1}`);
      }

      // Return processed node with all required fields
      return {
        ...node,
        completed: false,
        timeConsumed: 0,
        position: calculateNodePosition(index, roadmap.length)
      };
    });

    // Sort by sequence
    processedNodes.sort((a, b) => a.sequence - b.sequence);

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
  // Tree layout configuration
  const VERTICAL_SPACING = 100;     // Increased for more vertical space
  const MIN_NODE_SPACING = 140;     // Increased for more horizontal space
  const TOP_MARGIN = 50;
  const LEVEL_PADDING = 50;         // Increased padding between subtrees
  
  // Calculate the level (depth) of the node in the tree
  const level = Math.floor(Math.log2(index + 1));
  
  // Calculate position in current level
  const positionInLevel = index - (Math.pow(2, level) - 1);
  
  // Calculate total nodes at this level
  const nodesInLevel = Math.min(Math.pow(2, level), total - (Math.pow(2, level) - 1));
  
  // Base width calculation
  const baseWidth = MIN_NODE_SPACING * Math.pow(2, level);
  
  // Calculate x position
  // This ensures nodes spread out more as we go deeper in the tree
  const xSpacing = baseWidth / (nodesInLevel + 1);
  let x = (positionInLevel + 1) * xSpacing - (baseWidth / 2);
  
  // Add spacing between left and right subtrees
  if (level > 0) {
    const isRightSubtree = positionInLevel >= nodesInLevel / 2;
    const spreadFactor = Math.pow(1.5, level); // Increase spread for deeper levels
    x += isRightSubtree ? 
      LEVEL_PADDING * spreadFactor : 
      -LEVEL_PADDING * spreadFactor;
  }
  
  // Calculate y position with fixed spacing
  const y = level * VERTICAL_SPACING + TOP_MARGIN;

  return { x, y };
}
