import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { mongoose } from "@/lib/db";

// Define the Roadmap schema
const RoadmapSchema = new mongoose.Schema({
  name: String,
  userId: String,
  nodes: [Object],
  edges: [Object],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Get or create the Roadmap model
const Roadmap = mongoose.models.Roadmap || mongoose.model('Roadmap', RoadmapSchema);

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const roadmaps = await Roadmap.find({
      userId: session.user.id,
    }).sort({ updatedAt: -1 });

    return NextResponse.json(roadmaps);
  } catch (error) {
    console.error("[ROADMAP_SAVED]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 