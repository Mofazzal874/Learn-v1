import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { searchSuggestedVideos } from "@/lib/video-embedding";
import connectDB from "@/lib/db";
import { Video } from "@/models/Video";
import { Roadmap } from "@/models/Roadmap";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { query, topK = 5, roadmapId, nodeId } = body;

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

    // If roadmapId and nodeId are provided, save the suggestions to the roadmap
    if (roadmapId && nodeId && suggestedVideos.length > 0) {
      try {
        console.log(`[VIDEO_SUGGESTIONS_API] Saving suggestions to roadmap ${roadmapId}, node ${nodeId}`);
        
        // Find the roadmap
        const roadmap = await Roadmap.findOne({
          _id: roadmapId,
          userId: session.user.id
        });

        if (roadmap) {
          try {
            // Step 1: Ensure the roadmap has suggestion fields
            if (!roadmap.suggestedCourse || !roadmap.suggestedVideos) {
              console.log(`[VIDEO_SUGGESTIONS_API] Adding missing suggestion fields to roadmap ${roadmapId}`);
              
              const updateFields: Record<string, unknown[]> = {};
              if (!roadmap.suggestedCourse) updateFields.suggestedCourse = [];
              if (!roadmap.suggestedVideos) updateFields.suggestedVideos = [];
              
              await Roadmap.updateOne(
                { _id: roadmapId },
                { $set: updateFields }
              );
              console.log(`[VIDEO_SUGGESTIONS_API] Added missing fields to roadmap ${roadmapId}`);
            }

            // Step 2: Get current suggestions for this node
            const currentRoadmap = await Roadmap.findById(roadmapId);
            if (!currentRoadmap) {
              console.error(`[VIDEO_SUGGESTIONS_API] Roadmap not found: ${roadmapId}`);
              return;
            }

            const existingVideos = currentRoadmap.suggestedVideos || [];
            const existingVideoIds = new Set(
              existingVideos
                .filter((suggestion: { nodeId: string }) => suggestion.nodeId === nodeId)
                .map((suggestion: { videoId: mongoose.Types.ObjectId }) => suggestion.videoId.toString())
            );

            // Step 3: Prepare new suggestions
            const newSuggestions = suggestedVideos
              .filter((video): video is NonNullable<typeof video> => 
                video !== null && !existingVideoIds.has(video.videoId)
              )
              .map(video => ({
                videoId: new mongoose.Types.ObjectId(video.videoId),
                nodeId,
                status: false
              }));

            // Step 4: Save new suggestions
            if (newSuggestions.length > 0) {
              await Roadmap.updateOne(
                { _id: roadmapId },
                { 
                  $push: { 
                    suggestedVideos: { $each: newSuggestions } 
                  }
                }
              );
              console.log(`[VIDEO_SUGGESTIONS_API] Successfully saved ${newSuggestions.length} new video suggestions`);
            } else {
              console.log(`[VIDEO_SUGGESTIONS_API] No new video suggestions to add for node ${nodeId}`);
            }

          } catch (migrationError) {
            console.error(`[VIDEO_SUGGESTIONS_API] Error during suggestion save:`, migrationError);
            // Don't throw - continue with response
          }
        }
      } catch (saveError) {
        console.error("[VIDEO_SUGGESTIONS_API] Error saving suggestions:", saveError);
        // Continue with the response even if saving fails
      }
    }

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