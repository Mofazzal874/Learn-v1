// Get Roadmap by ID
// pages/api/roadmap/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import { Roadmap } from "@/models/Roadmap";
import { getSession } from "@/lib/getSession";
import mongoose from "mongoose";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { id },
    method,
  } = req;

  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ message: "Invalid Roadmap ID" });
  }

  await connectDB();

  switch (method) {
    case "GET":
      const roadmap = await Roadmap.findOne({ _id: id, userId: (await getSession())?.user?.id });
      if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
      res.status(200).json(roadmap);
      break;
    // Additional methods like PUT, DELETE can be handled here
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
