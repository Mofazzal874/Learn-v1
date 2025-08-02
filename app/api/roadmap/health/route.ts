import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { checkEmbeddingServicesHealth } from "@/lib/embedding";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const healthStatus = await checkEmbeddingServicesHealth();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      services: {
        cohere: {
          healthy: healthStatus.cohere,
          configured: !!process.env.COHERE_API_KEY,
        },
        pinecone: {
          healthy: healthStatus.pinecone,
          configured: !!(process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME),
        },
      },
      errors: healthStatus.errors,
      overall: healthStatus.cohere && healthStatus.pinecone,
    });

  } catch (error: any) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { 
        error: "Health check failed", 
        details: error.message,
        timestamp: new Date().toISOString(),
        overall: false,
      },
      { status: 500 }
    );
  }
}