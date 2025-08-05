import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { searchSuggestedVideos } from "@/lib/video-embedding";
import connectDB from "@/lib/db";
import { Video } from "@/models/Video";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { query, topK = 5 } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query text is required" },
        { status: 400 }
      );
    }

    console.log(`[VIDEO_SUGGESTIONS_API] Searching for videos with query: "${query}"`);

    // Search for similar videos using embeddings
    const searchResults = await searchSuggestedVideos(query, topK);

    if (searchResults.length === 0) {
      console.log('[VIDEO_SUGGESTIONS_API] No videos found');
      return NextResponse.json({
        suggestions: [],
        message: "No videos found for this query"
      });
    }

    // Get full video details from database
    const videoIds = searchResults.map(result => result.videoId);
    const videos = await Video.find({
      _id: { $in: videoIds },
      published: true // Only show published videos
    }).select('_id title subtitle category level duration thumbnail views rating');

    // Combine search results with video details and preserve order/scores
    const suggestedVideos = searchResults.map(searchResult => {
      const video = videos.find(v => v._id.toString() === searchResult.videoId);
      if (!video) return null;

      return {
        videoId: video._id.toString(),
        title: video.title,
        subtitle: video.subtitle || '',
        category: video.category,
        level: video.level,
        duration: video.duration || '',
        thumbnail: video.thumbnail,
        views: video.views || 0,
        rating: video.rating || 0,
        score: searchResult.score
      };
    }).filter(Boolean); // Remove null values

    console.log(`[VIDEO_SUGGESTIONS_API] Found ${suggestedVideos.length} suggested videos`);

    return NextResponse.json({
      suggestions: suggestedVideos,
      total: suggestedVideos.length
    });

  } catch (error: unknown) {
    console.error("[VIDEO_SUGGESTIONS_API] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch video suggestions",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}