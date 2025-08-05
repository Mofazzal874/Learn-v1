import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { searchSuggestedCourses } from "@/lib/course-embedding";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";

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