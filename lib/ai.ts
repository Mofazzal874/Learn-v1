// lib/ai.ts
import axios from "axios";

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
  Create a ${roadmapType} roadmap for learning ${prompt} at a ${level} level. 
  Output the roadmap as a JSON array of nodes, where each node has an id, title, and children (array of child node ids). Ensure that the roadmap is detailed and covers all essential topics.
  `;

  const response = await axios.post(
    "https://api.openai.com/v1/completions",
    {
      model: "text-davinci-003",
      prompt: aiPrompt,
      max_tokens: 1500,
      temperature: 0.7,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );

  const text = response.data.choices[0].text.trim();

  // Assuming the AI returns JSON, parse it
  let roadmap;
  try {
    roadmap = JSON.parse(text);
  } catch (error) {
    throw new Error("Failed to parse AI response");
  }

  // Validate and process the roadmap
  // Assign positions for React Flow visualization (can be random or algorithmic)
  const processedRoadmap = roadmap.map((node: any, index: number) => ({
    ...node,
    position: {
      x: Math.random() * 500,
      y: Math.random() * 500,
    },
  }));

  return processedRoadmap;
};
