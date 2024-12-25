// pages/api/roadmap/update/[id].ts

import { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import { Roadmap } from "@/models/Roadmap";
import { getSession } from "@/lib/getSession";
import mongoose from "mongoose";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { id },
    method,
    body,
  } = req;

  if (method !== "PUT") return res.status(405).json({ message: "Method not allowed" });

  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ message: "Invalid Roadmap ID" });
  }

  const session = await getSession();
  if (!session?.user?.id) return res.status(401).json({ message: "Unauthorized" });

  await connectDB();

  const roadmap = await Roadmap.findOne({ _id: id, userId: session.user.id });
  if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });

  // Update nodes and edges if provided
  if (body.nodes) roadmap.nodes = body.nodes;
  if (body.edges) roadmap.edges = body.edges;

  await roadmap.save();
  res.status(200).json(roadmap);
}
