import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import connectDB from "@/lib/db";
import { Roadmap } from "@/models/Roadmap";
import mongoose from "mongoose";

// Import Course and Video models to fetch full details
const CourseSchema = new mongoose.Schema({}, { strict: false });
const VideoSchema = new mongoose.Schema({}, { strict: false });
const Course = mongoose.models?.Course || mongoose.model('Course', CourseSchema);
const Video = mongoose.models?.Video || mongoose.model('Video', VideoSchema);

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { roadmapId, nodeId } = body;

    if (!roadmapId || !nodeId) {
      return NextResponse.json(
        { error: "roadmapId and nodeId are required" },
        { status: 400 }
      );
    }

    console.log(`[EXISTING_SUGGESTIONS] Getting suggestions for roadmap ${roadmapId}, node ${nodeId}`);

    // Find the roadmap
    const roadmap = await Roadmap.findOne({
      _id: roadmapId,
      userId: session.user.id
    });

    if (!roadmap) {
      return NextResponse.json(
        { error: "Roadmap not found" },
        { status: 404 }
      );
    }

    // Ensure the roadmap has suggestion fields (for backwards compatibility)
    if (!roadmap.suggestedCourse || !roadmap.suggestedVideos) {
      console.log(`[EXISTING_SUGGESTIONS] Adding missing suggestion fields to roadmap ${roadmapId}`);
      
      const updateFields: Record<string, unknown[]> = {};
      if (!roadmap.suggestedCourse) updateFields.suggestedCourse = [];
      if (!roadmap.suggestedVideos) updateFields.suggestedVideos = [];
      
      await Roadmap.updateOne(
        { _id: roadmapId },
        { $set: updateFields }
      );
      console.log(`[EXISTING_SUGGESTIONS] Added missing fields to roadmap ${roadmapId}`);
      
      // Get the updated roadmap
      const updatedRoadmap = await Roadmap.findById(roadmapId);
      if (updatedRoadmap) {
        roadmap.suggestedCourse = updatedRoadmap.suggestedCourse || [];
        roadmap.suggestedVideos = updatedRoadmap.suggestedVideos || [];
      }
    }

    // Filter suggestions for this specific node
    const nodeCourses: Array<{ nodeId: string; courseId: mongoose.Types.ObjectId; status: boolean }> = (roadmap.suggestedCourse || [])
      .filter((suggestion: { nodeId: string; courseId: mongoose.Types.ObjectId; status: boolean }) => suggestion.nodeId === nodeId);
    
    const nodeVideos: Array<{ nodeId: string; videoId: mongoose.Types.ObjectId; status: boolean }> = (roadmap.suggestedVideos || [])
      .filter((suggestion: { nodeId: string; videoId: mongoose.Types.ObjectId; status: boolean }) => suggestion.nodeId === nodeId);

    // Fetch full course details
    const existingCourses = [];
    if (nodeCourses.length > 0) {
      const courseIds = nodeCourses.map(suggestion => suggestion.courseId);
      const coursesFromDB = await Course.find({ _id: { $in: courseIds } });
      
      for (const suggestion of nodeCourses) {
        const course = coursesFromDB.find(c => c._id.toString() === suggestion.courseId.toString());
        if (course) {
          existingCourses.push({
            courseId: course._id.toString(),
            title: course.title || 'Unknown Course',
            subtitle: course.subtitle || '',
            category: course.category || 'General',
            level: course.level || 'beginner',
            price: course.price || 0,
            isFree: course.isFree || false,
            thumbnail: course.thumbnail || '',
            status: suggestion.status,
            score: 1.0 // Default score for existing suggestions
          });
        }
      }
    }

    // Fetch full video details
    const existingVideos = [];
    if (nodeVideos.length > 0) {
      const videoIds = nodeVideos.map(suggestion => suggestion.videoId);
      const videosFromDB = await Video.find({ _id: { $in: videoIds } });
      
      for (const suggestion of nodeVideos) {
        const video = videosFromDB.find(v => v._id.toString() === suggestion.videoId.toString());
        if (video) {
          existingVideos.push({
            videoId: video._id.toString(),
            title: video.title || 'Unknown Video',
            subtitle: video.subtitle || '',
            category: video.category || 'General',
            level: video.level || 'beginner',
            duration: video.duration || '0:00',
            thumbnail: video.thumbnail || '',
            views: video.views || 0,
            rating: video.rating || 0,
            status: suggestion.status,
            score: 1.0 // Default score for existing suggestions
          });
        }
      }
    }

    console.log(`[EXISTING_SUGGESTIONS] Found ${existingCourses.length} courses and ${existingVideos.length} videos for node ${nodeId}`);

    return NextResponse.json({
      courses: existingCourses,
      videos: existingVideos
    });

  } catch (error: unknown) {
    console.error("[EXISTING_SUGGESTIONS] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch existing suggestions",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}