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
].filter(keyword => keyword && keyword.trim().length > 0); // Remove any empty strings

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
  roadmapType: "week-by-week" | "topic-wise",
  userSkills: string[] = []
) => {
  console.log("Starting AI generation with:", { prompt, level, roadmapType, userSkills });

  try {
    // Validate prompt before making API request
    validatePrompt(prompt);

    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured in environment variables");
    }

    const roadmapPrompt = `
As an expert JSON generator for learning roadmaps, create a valid JSON object with a nodes array for a "${prompt}" learning roadmap.

RESPONSE FORMAT:
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

REQUIREMENTS:
- ALL nodes must have: id, title, description (array), children (array), sequence (number), timeNeeded (hours)
- id format: "node_X" where X is a number
- title format: must start with sequence number (e.g., "1. Introduction")
- For ${level} level: create ${level === "beginner" ? "8-10" : level === "intermediate" ? "11-15" : "15-18"} nodes
- Maximum 2 child nodes per parent (binary tree structure)
- For time allocation: beginner (1-4h), intermediate (2-6h), advanced (4-10h)

${userSkills.length > 0 ? `
USER'S EXISTING SKILLS:
The user already has experience with: ${userSkills.join(", ")}

IMPORTANT INSTRUCTIONS FOR EXISTING SKILLS:
- For skills directly relevant to ${prompt} (like "${userSkills.filter(skill => 
  skill.toLowerCase().includes(prompt.toLowerCase().split(' ')[0]) || 
  prompt.toLowerCase().includes(skill.toLowerCase().split(' ')[0])
).join('", "')}"): Reference these as prerequisites the user already knows, mention them briefly for review but don't create dedicated learning nodes
- For supporting skills (like cloud, DevOps, etc.): These can be mentioned as complementary or for advanced applications
- Focus the roadmap on NEW concepts and skills the user needs to learn for ${prompt}
- You can suggest how their existing skills connect to or support the new learning
` : ''}

TREE STRUCTURE REQUIREMENTS:
- Start with a single root node (node_1)
- Each node must have 0-2 children only
- IMPORTANT: Create a SINGLE connected tree where all nodes are reachable from the root
- Ensure parent-child relationships follow a logical progression (prerequisites → advanced topics)
- Every node (except the root) must be a child of exactly one other node
- The tree should progress from foundational topics to advanced concepts

Generate a complete, coherent roadmap for learning ${prompt} at a ${level} level.`;

    // Update the system message to be more strict
    const systemMessage = `You are a JSON generator API that ONLY outputs valid JSON objects. 
CRITICAL: Your entire response must be a properly formatted JSON object with the structure {"nodes": [...]}.
Do not include ANY explanation text, markdown formatting, or code blocks.
Only the raw JSON is allowed in your response.`;

    console.log("Making request to Groq API");
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "qwen/qwen3-32b",
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
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9,
        frequency_penalty: 0.2,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        timeout: 30000
      }
    );

    console.log("Received response from Groq API");

    if (!response.data?.choices?.[0]?.message?.content) {
      console.error("Invalid API response:", response.data);
      throw new Error("Invalid response from Groq API");
    }

    const text = response.data.choices[0].message.content.trim();
    console.log("Raw AI response length:", text.length);
    
    // Log the first and last part of the response for debugging
    console.log("Response preview:", 
      text.substring(0, 100) + "..." + 
      text.substring(text.length - 100)
    );

    let parsedResponse;
    try {
      // First try to parse the raw response
      parsedResponse = JSON.parse(text);
    } catch (e: any) {
      console.error("JSON parse error:", e);
      
      // If direct parsing fails, try to extract JSON from the text
      // This handles cases where the model adds explanatory text
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedJson = jsonMatch[0];
          console.log("Attempting to parse extracted JSON");
          parsedResponse = JSON.parse(extractedJson);
        } else {
          throw new Error("Could not extract valid JSON from response");
        }
      } catch (extractError) {
        console.error("Failed to extract and parse JSON:", extractError);
        throw new Error("Failed to parse JSON response: " + e.message);
      }
    }

    // Ensure we have a nodes array
    if (!parsedResponse || !parsedResponse.nodes || !Array.isArray(parsedResponse.nodes)) {
      console.error("Invalid response structure:", parsedResponse);
      throw new Error("Invalid response format: missing nodes array");
    }

    if (parsedResponse.nodes.length === 0) {
      throw new Error("Received empty nodes array from AI service");
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
        processedNode.children = processedNode.children.filter((childId: string) => 
          roadmap.some((n: RoadmapNode) => n.id === childId)
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

    // Ensure the tree is connected by checking and fixing the relationship structure
    ensureConnectedTree(processedNodes);

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
      response: error.response?.data,
      status: error.response?.status
    });

    // Handle Groq API specific errors
    if (error.response?.status === 400) {
      // Check if it's a model issue or a parameter issue
      const errorData = error.response.data;
      console.error("Groq API 400 error details:", errorData);
      
      // Create fallback nodes for testing/debug
      if (process.env.NODE_ENV === 'development') {
        console.log("Creating fallback nodes for development environment");
        const fallbackNodes = createFallbackNodes(prompt, level, userSkills);
        return fallbackNodes;
      }
      
      throw new Error("The AI service couldn't process this request. Please try again with different parameters.");
    }

    // Throw a user-friendly error
    throw new Error(
      error.response?.status === 401 ? "Authentication failed" :
      error.response?.status === 429 ? "Too many requests. Please try again later." :
      errorMessage
    );
  }
};

// Function to create fallback nodes for development/testing
function createFallbackNodes(prompt: string, level: string, userSkills: string[] = []): RoadmapNode[] {
  const nodeCount = level === "beginner" ? 8 : level === "intermediate" ? 12 : 15;
  const nodes: RoadmapNode[] = [];
  
  // Create nodes first
  for (let i = 0; i < nodeCount; i++) {
    const node: RoadmapNode = {
      id: `node_${i + 1}`,
      title: `${i + 1}. ${prompt} ${i === 0 ? 'Fundamentals' : `Topic ${i + 1}`}`,
      description: [
        `Learn the ${i === 0 ? 'basics' : 'concepts'} of ${prompt} ${i === 0 ? 'fundamentals' : `topic ${i + 1}`}`,
        `Key areas: Theory, Practice, Application`,
        `Complete exercises related to ${prompt} ${i === 0 ? 'basics' : `topic ${i + 1}`}`
      ],
      children: [], // Will be filled in next step
      sequence: i + 1,
      timeNeeded: Math.floor(Math.random() * 5) + 1,
      timeConsumed: 0,
      completed: false,
      position: calculateNodePosition(i, nodeCount)
    };
    nodes.push(node);
  }
  
  // Create a binary tree structure
  // Each node i has children at positions 2i+1 and 2i+2 (if they exist)
  for (let i = 0; i < nodeCount; i++) {
    const leftChildIndex = 2 * i + 1;
    const rightChildIndex = 2 * i + 2;
    
    if (leftChildIndex < nodeCount) {
      nodes[i].children.push(nodes[leftChildIndex].id);
    }
    
    if (rightChildIndex < nodeCount) {
      nodes[i].children.push(nodes[rightChildIndex].id);
    }
  }
  
  // Adjust node titles to reflect their position in the tree
  nodes.forEach((node, index) => {
    if (index === 0) {
      node.title = `1. Introduction to ${prompt}`;
    } else {
      const depth = Math.floor(Math.log2(index + 1));
      const phase = depth <= 1 ? 'Fundamentals' : depth === 2 ? 'Intermediate Concepts' : 'Advanced Topics';
      node.title = `${index + 1}. ${phase}: ${prompt} ${nodeTypes[index % nodeTypes.length]}`;
    }
  });
  
  return nodes;
}

// Different types of learning nodes for more variety in fallback nodes
const nodeTypes = [
  'Concepts',
  'Practical Application',
  'Theory',
  'Problem Solving',
  'Case Study',
  'Project Implementation',
  'Best Practices',
  'Tools & Frameworks',
  'Design Patterns',
  'Evaluation & Testing'
];

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

// Function to ensure all nodes are connected in a single tree
function ensureConnectedTree(nodes: RoadmapNode[]) {
  if (nodes.length === 0) return;
  
  // Create a set to track which nodes are reachable from the root
  const connectedNodes = new Set<string>();
  const nodeMap = new Map<string, RoadmapNode>();
  
  // Build a map of nodes by ID for quick access
  nodes.forEach(node => nodeMap.set(node.id, node));
  
  // Add the first node (root) to the connected set
  connectedNodes.add(nodes[0].id);
  
  // Recursively mark all nodes reachable from the root
  function markReachableNodes(nodeId: string) {
    const node = nodeMap.get(nodeId);
    if (!node) return;
    
    node.children.forEach(childId => {
      if (!connectedNodes.has(childId)) {
        connectedNodes.add(childId);
        markReachableNodes(childId);
      }
    });
  }
  
  // Start from the root node
  markReachableNodes(nodes[0].id);
  
  // Find disconnected nodes
  const disconnectedNodes = nodes.filter(node => !connectedNodes.has(node.id));
  
  // Connect disconnected nodes to the tree
  if (disconnectedNodes.length > 0) {
    console.log(`Found ${disconnectedNodes.length} disconnected nodes. Connecting to tree...`);
    
    // Connect each disconnected node to an appropriate parent
    disconnectedNodes.forEach(node => {
      // Find a potential parent based on sequence number
      const potentialParents = nodes.filter(n => 
        connectedNodes.has(n.id) && 
        n.sequence < node.sequence &&
        n.children.length < 2 // Limit to 2 children per node
      );
      
      if (potentialParents.length > 0) {
        // Sort by sequence to find closest parent
        potentialParents.sort((a, b) => b.sequence - a.sequence);
        const parent = potentialParents[0];
        
        // Add the disconnected node as a child of the parent
        parent.children.push(node.id);
        connectedNodes.add(node.id);
        
        console.log(`Connected node ${node.id} (${node.title}) to parent ${parent.id} (${parent.title})`);
      } else {
        // If no suitable parent found, connect to the root node
        nodes[0].children.push(node.id);
        connectedNodes.add(node.id);
        console.log(`Connected node ${node.id} (${node.title}) to root node`);
      }
    });
    
    // Recursively ensure all nodes are now connected
    markReachableNodes(nodes[0].id);
    
    // Check if there are still disconnected nodes
    const stillDisconnected = nodes.filter(node => !connectedNodes.has(node.id));
    if (stillDisconnected.length > 0) {
      console.warn(`Still have ${stillDisconnected.length} disconnected nodes after fixing`);
    } else {
      console.log('All nodes are now connected in a single tree');
    }
  }
}
