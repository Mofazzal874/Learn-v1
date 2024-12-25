// Create Roadmap
// pages/api/roadmap/create.ts
import { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import { Roadmap } from "@/models/Roadmap";
import { getSession } from "@/lib/getSession";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const session = await getSession();
  if (!session?.user?.id) return res.status(401).json({ message: "Unauthorized" });

  const { title, level, roadmapType, treeDirection } = req.body;

  if (!title || !level || !roadmapType) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  await connectDB();

  const newRoadmap = await Roadmap.create({
    userId: session.user.id,
    title,
    level,
    roadmapType,
    treeDirection: treeDirection || "top-down",
    nodes: [], // Initialize with empty nodes; to be populated via AI generation
  });

  res.status(201).json(newRoadmap);
}
