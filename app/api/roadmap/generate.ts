//Generate Roadmap via AI
// app/api/roadmap/generate.ts
import { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import { Roadmap } from "@/models/Roadmap";
import { getSession } from "@/lib/getSession";
import { generateRoadmap } from "@/lib/ai"; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const session = await getSession();
  if (!session?.user?.id) return res.status(401).json({ message: "Unauthorized" });

  const { roadmapId, prompt, level, roadmapType } = req.body;

  if (!roadmapId || !prompt || !level || !roadmapType) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  await connectDB();

  const roadmap = await Roadmap.findOne({ _id: roadmapId, userId: session.user.id });
  if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });

  try {
    const aiGeneratedRoadmap = await generateRoadmap(prompt, level, roadmapType);
    // aiGeneratedRoadmap should be an array of nodes with relationships

    // Example structure:
    // [
    //   { id: '1', title: 'Introduction', children: ['2', '3'] },
    //   { id: '2', title: 'Topic A', children: [] },
    //   { id: '3', title: 'Topic B', children: [] },
    // ]

    roadmap.nodes = aiGeneratedRoadmap;
    await roadmap.save();

    res.status(200).json(roadmap);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating roadmap" });
  }
}
