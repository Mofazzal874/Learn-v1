import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { searchSuggestedCourses } from "@/lib/course-embedding";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
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

    console.log(`[COURSE_SUGGESTIONS_API] Searching for courses with query: "${query}"`);

    // Search for similar courses using embeddings
    const searchResults = await searchSuggestedCourses(query, topK);

    if (searchResults.length === 0) {
      console.log('[COURSE_SUGGESTIONS_API] No courses found');
      return NextResponse.json({
        suggestions: [],
        message: "No courses found for this query"
      });
    }

    // Get full course details from database
    const courseIds = searchResults.map(result => result.courseId);
    const courses = await Course.find({
      _id: { $in: courseIds },
      published: true, // Only show published courses
      approved: true   // Only show approved courses
    }).select('_id title subtitle category level price isFree thumbnail');

    // Combine search results with course details and preserve order/scores
    const suggestedCourses = searchResults.map(searchResult => {
      const course = courses.find(c => c._id.toString() === searchResult.courseId);
      if (!course) return null;

      return {
        courseId: course._id.toString(),
        title: course.title,
        subtitle: course.subtitle || '',
        category: course.category,
        level: course.level,
        price: course.price,
        isFree: course.isFree,
        thumbnail: course.thumbnail,
        score: searchResult.score
      };
    }).filter(Boolean); // Remove null values

    console.log(`[COURSE_SUGGESTIONS_API] Found ${suggestedCourses.length} suggested courses`);

    // If roadmapId and nodeId are provided, save the suggestions to the roadmap
    if (roadmapId && nodeId && suggestedCourses.length > 0) {
      try {
        console.log(`[COURSE_SUGGESTIONS_API] Saving suggestions to roadmap ${roadmapId}, node ${nodeId}`);
        
        // Find the roadmap
        const roadmap = await Roadmap.findOne({
          _id: roadmapId,
          userId: session.user.id
        });

        if (roadmap) {
          try {
            // Step 1: Ensure the roadmap has suggestion fields
            if (!roadmap.suggestedCourse || !roadmap.suggestedVideos) {
              console.log(`[COURSE_SUGGESTIONS_API] Adding missing suggestion fields to roadmap ${roadmapId}`);
              
              const updateFields: Record<string, unknown[]> = {};
              if (!roadmap.suggestedCourse) updateFields.suggestedCourse = [];
              if (!roadmap.suggestedVideos) updateFields.suggestedVideos = [];
              
              await Roadmap.updateOne(
                { _id: roadmapId },
                { $set: updateFields }
              );
              console.log(`[COURSE_SUGGESTIONS_API] Added missing fields to roadmap ${roadmapId}`);
            }

            // Step 2: Get current suggestions for this node
            const currentRoadmap = await Roadmap.findById(roadmapId);
            if (!currentRoadmap) {
              console.error(`[COURSE_SUGGESTIONS_API] Roadmap not found: ${roadmapId}`);
              return;
            }

            const existingCourses = currentRoadmap.suggestedCourse || [];
            const existingCourseIds = new Set(
              existingCourses
                .filter((suggestion: { nodeId: string }) => suggestion.nodeId === nodeId)
                .map((suggestion: { courseId: mongoose.Types.ObjectId }) => suggestion.courseId.toString())
            );

            // Step 3: Prepare new suggestions
            const newSuggestions = suggestedCourses
              .filter((course): course is NonNullable<typeof course> => 
                course !== null && !existingCourseIds.has(course.courseId)
              )
              .map(course => ({
                courseId: new mongoose.Types.ObjectId(course.courseId),
                nodeId,
                status: false
              }));

            // Step 4: Save new suggestions
            if (newSuggestions.length > 0) {
              await Roadmap.updateOne(
                { _id: roadmapId },
                { 
                  $push: { 
                    suggestedCourse: { $each: newSuggestions } 
                  }
                }
              );
              console.log(`[COURSE_SUGGESTIONS_API] Successfully saved ${newSuggestions.length} new course suggestions`);
            } else {
              console.log(`[COURSE_SUGGESTIONS_API] No new course suggestions to add for node ${nodeId}`);
            }

          } catch (migrationError) {
            console.error(`[COURSE_SUGGESTIONS_API] Error during suggestion save:`, migrationError);
            // Don't throw - continue with response
          }
        }
      } catch (saveError) {
        console.error("[COURSE_SUGGESTIONS_API] Error saving suggestions:", saveError);
        // Continue with the response even if saving fails
      }
    }

    return NextResponse.json({
      suggestions: suggestedCourses,
      total: suggestedCourses.length
    });

  } catch (error: unknown) {
    console.error("[COURSE_SUGGESTIONS_API] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch course suggestions",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}