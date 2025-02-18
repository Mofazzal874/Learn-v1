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
CRITICAL: You must return a JSON object with a nodes array.

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

STRICT REQUIREMENTS:
1. ALL nodes must have these exact fields:
   - id: string starting with "node_" followed by a number
   - title: string starting with the sequence number
   - description: array of 2-3 strings
   - children: array of node IDs (can be empty)
   - sequence: number starting from 1
   - timeNeeded: number of hours (1-20)

2. Field requirements:
   - No missing or null fields allowed
   - description must be a non-empty array
   - children must be an array (can be empty)
   - sequence must be a positive number
   - timeNeeded must be a positive number

3. Node count requirements:
   - Beginner level: minimum 8-10 nodes
   - Intermediate level: minimum 11-15 nodes
   - Advanced level: minimum 15-18 nodes

4. Learning progression requirements:
   - Start with fundamental concepts
   - Each topic must build upon previous topics
   - Include practical exercises or hands-on tasks
   - Break complex topics into smaller sub-topics
   - Maximum 2 child nodes per parent (binary tree structure)
   - Ensure logical dependencies between connected nodes

5. Description content requirements:
   - First point: What you'll learn
   - Second point: Key concepts/skills covered
   - Third point: Practical application or exercise

6. Time allocation:
   - Beginner topics: 1-4 hours per node
   - Intermediate topics: 2-6 hours per node
   - Advanced topics: 4-10 hours per node
   - Complex topics should be broken down into smaller chunks

7. Topic organization:
   - Group related concepts together
   - Maintain clear prerequisite relationships
   - Balance theoretical and practical content
   - Include assessment/practice points
   - End with a capstone or project node

Generate a ${level} level learning roadmap for: ${prompt}`;

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
        temperature: 0.9,
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
      try {
        // Ensure all required fields exist with default values if needed
        const processedNode = {
          id: node.id || `node_${index + 1}`,
          title: node.title || `${index + 1}. Untitled Node`,
          description: Array.isArray(node.description) ? node.description : [],
          children: Array.isArray(node.children) ? node.children : [],
          sequence: typeof node.sequence === 'number' ? node.sequence : index + 1,
          timeNeeded: typeof node.timeNeeded === 'number' ? node.timeNeeded : 0,
          completed: false,
          timeConsumed: 0,
          position: calculateNodePosition(index, roadmap.length)
        };

        // Validate the processed node
        if (!processedNode.title.match(/^\d+\./)) {
          processedNode.title = `${processedNode.sequence}. ${processedNode.title.replace(/^\d+\.\s*/, '')}`;
        }

        if (processedNode.description.length === 0) {
          processedNode.description = ["No description available"];
        }

        // Ensure children array contains valid node IDs
        processedNode.children = processedNode.children.filter(childId => 
          roadmap.some(n => n.id === childId)
        );

        return processedNode;
      } catch (e) {
        console.error(`Error processing node at position ${index + 1}:`, e);
        // Return a valid default node instead of throwing
        return {
          id: `node_${index + 1}`,
          title: `${index + 1}. Topic ${index + 1}`,
          description: ["Content to be added"],
          children: [],
          sequence: index + 1,
          timeNeeded: 1,
          completed: false,
          timeConsumed: 0,
          position: calculateNodePosition(index, roadmap.length)
        };
      }
    });

    // Sort by sequence and fix any sequence gaps
    processedNodes.sort((a, b) => a.sequence - b.sequence);
    processedNodes.forEach((node, index) => {
      node.sequence = index + 1;
      node.title = `${index + 1}. ${node.title.replace(/^\d+\.\s*/, '')}`;
    });

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
