import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import connectDB from "@/lib/db";
import { RoadmapEmbeddingDetails } from "@/models/RoadmapEmbeddingDetails";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id: roadmapId } = params;

    const embeddingRecord = await RoadmapEmbeddingDetails.findOne({
      roadmapId,
      userId: session.user.id,
    }).select('status lastEmbeddedAt processingMetadata errorMessage');

    if (!embeddingRecord) {
      return NextResponse.json({
        status: "not_found",
        message: "No embedding record found for this roadmap"
      });
    }

    return NextResponse.json({
      status: embeddingRecord.status,
      lastEmbeddedAt: embeddingRecord.lastEmbeddedAt,
      processingTime: embeddingRecord.processingMetadata?.processingTime,
      cohereModel: embeddingRecord.processingMetadata?.cohereModel,
      errorMessage: embeddingRecord.errorMessage,
    });

  } catch (error: any) {
    console.error("Error fetching embedding status:", error);
    return NextResponse.json(
      { error: "Failed to fetch embedding status", details: error.message },
      { status: 500 }
    );
  }
}