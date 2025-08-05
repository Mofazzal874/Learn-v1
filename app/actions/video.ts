'use server'

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { Video } from "@/models/Video";
import { uploadImage, uploadVideo, deleteAsset, CloudinaryUploadResult } from "@/lib/cloudinary";
import { processVideoEmbedding, deleteVideoEmbedding } from "@/lib/video-embedding";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

export interface CloudinaryAsset {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  duration?: number;
  bytes: number;
  width?: number;
  height?: number;
}

export interface VideoFormData {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  subcategory?: string;
  level: string;
  prerequisites: string[];
  outcomes: string[];
  tags: string[];
  language: string;
  thumbnail: File | null;
  video: File | null;
  thumbnailAsset?: CloudinaryAsset;
  videoAsset?: CloudinaryAsset;
}

export async function createVideo(videoData: VideoFormData): Promise<string> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized - Please sign in');
  }

  await connectDB();

  try {
    // Set up variables for Cloudinary assets
    let thumbnailResult: CloudinaryUploadResult | null = null;
    let videoResult: CloudinaryUploadResult | null = null;

    // Priority 1: Use the direct Cloudinary upload results if available
    if (videoData.thumbnailAsset) {
      thumbnailResult = {
        public_id: videoData.thumbnailAsset.public_id,
        secure_url: videoData.thumbnailAsset.secure_url,
        resource_type: videoData.thumbnailAsset.resource_type as 'image' | 'video' | 'raw',
        format: videoData.thumbnailAsset.format,
        width: videoData.thumbnailAsset.width,
        height: videoData.thumbnailAsset.height,
        bytes: videoData.thumbnailAsset.bytes,
        created_at: new Date()
      };
    }
    
    if (videoData.videoAsset) {
      videoResult = {
        public_id: videoData.videoAsset.public_id,
        secure_url: videoData.videoAsset.secure_url,
        resource_type: videoData.videoAsset.resource_type as 'image' | 'video' | 'raw',
        format: videoData.videoAsset.format,
        duration: videoData.videoAsset.duration,
        bytes: videoData.videoAsset.bytes,
        width: videoData.videoAsset.width,
        height: videoData.videoAsset.height,
        created_at: new Date()
      };
    }
    
    // Priority 2: Upload files to Cloudinary only if we don't already have assets
    if (!thumbnailResult && videoData.thumbnail) {
      // Convert File to base64 string for upload
      const arrayBuffer = await videoData.thumbnail.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataURL = `data:${videoData.thumbnail.type};base64,${base64}`;
      
      thumbnailResult = await uploadImage(dataURL, 'videos/thumbnails');
    }

    if (!videoResult && videoData.video) {
      // Convert File to base64 string for upload
      const arrayBuffer = await videoData.video.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataURL = `data:${videoData.video.type};base64,${base64}`;
      
      videoResult = await uploadVideo(dataURL, 'videos');
    }

    if (!videoResult) {
      throw new Error('Video file is required');
    }

    // Generate a slug from the title
    const slug = videoData.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Calculate duration from video metadata if available
    const duration = videoResult.duration ? 
      `${Math.floor(videoResult.duration / 60)}:${Math.floor(videoResult.duration % 60).toString().padStart(2, '0')}` : 
      '0:00';

    // Create the video using Mongoose
    console.log(`[CREATE_VIDEO_ACTION] Creating video "${videoData.title}" for user ${session.user.id}`);
    const video = await Video.create({
      title: videoData.title,
      subtitle: videoData.subtitle || '',
      slug,
      description: videoData.description,
      userId: new mongoose.Types.ObjectId(session.user.id),
      thumbnail: thumbnailResult?.secure_url || '',
      thumbnailAsset: thumbnailResult,
      videoLink: videoResult.secure_url,
      videoAsset: videoResult,
      category: videoData.category,
      subcategory: videoData.subcategory || '',
      level: videoData.level,
      prerequisites: videoData.prerequisites || [],
      outcomes: videoData.outcomes || [],
      tags: videoData.tags || [],
      language: videoData.language || 'English',
      duration,
      published: false
    });

    console.log(`[CREATE_VIDEO_ACTION] Video created successfully with ID: ${video._id}`);

    // Process embeddings asynchronously - don't wait for completion
    processVideoEmbeddingsAsync(video, session.user.id);

    revalidatePath('/private/videos');
    revalidatePath('/tutor/videos');

    return video._id.toString();
  } catch (error) {
    console.error("Video creation error:", error);
    
    // Handle duplicate slug error
    if (error instanceof Error && error.message.includes('E11000') && error.message.includes('slug_1')) {
      throw new Error('A video with this title already exists. Please choose a different title.');
    }
    
    throw new Error(error instanceof Error ? error.message : "Failed to create video");
  }
}

export async function updateVideo(videoId: string, videoData: Partial<VideoFormData>): Promise<void> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized - Please sign in');
  }

  await connectDB();

  try {
    const video = await Video.findById(videoId);
    
    if (!video) {
      throw new Error('Video not found');
    }

    // Check if user owns the video
    if (video.userId.toString() !== session.user.id) {
      throw new Error('Unauthorized - You can only update your own videos');
    }

    // Handle asset uploads if provided
    let thumbnailResult = video.thumbnailAsset;
    let videoResult = video.videoAsset;

    if (videoData.thumbnailAsset) {
      thumbnailResult = videoData.thumbnailAsset;
    } else if (videoData.thumbnail) {
      const arrayBuffer = await videoData.thumbnail.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataURL = `data:${videoData.thumbnail.type};base64,${base64}`;
      
      const uploadResult = await uploadImage(dataURL, 'videos/thumbnails');
      thumbnailResult = uploadResult;
    }

    if (videoData.videoAsset) {
      videoResult = videoData.videoAsset;
    } else if (videoData.video) {
      const arrayBuffer = await videoData.video.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataURL = `data:${videoData.video.type};base64,${base64}`;
      
      const uploadResult = await uploadVideo(dataURL, 'videos');
      videoResult = uploadResult;
    }

    // Generate new slug if title changed
    let slug = video.slug;
    if (videoData.title && videoData.title !== video.title) {
      slug = videoData.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Calculate duration if video was updated
    let duration = video.duration;
    if (videoResult && videoResult.duration) {
      duration = `${Math.floor(videoResult.duration / 60)}:${Math.floor(videoResult.duration % 60).toString().padStart(2, '0')}`;
    }

    // Check if embedding-related fields changed
    const hasEmbeddingRelevantChanges = 
      videoData.title || 
      videoData.subtitle !== undefined || 
      videoData.description || 
      videoData.category || 
      videoData.subcategory !== undefined || 
      videoData.level || 
      videoData.prerequisites || 
      videoData.outcomes || 
      videoData.tags;

    // Update the video
    console.log(`[UPDATE_VIDEO_ACTION] Updating video ${videoId} for user ${session.user.id}`);
    await Video.findByIdAndUpdate(videoId, {
      ...(videoData.title && { title: videoData.title }),
      ...(videoData.subtitle !== undefined && { subtitle: videoData.subtitle }),
      slug,
      ...(videoData.description && { description: videoData.description }),
      ...(videoData.category && { category: videoData.category }),
      ...(videoData.subcategory !== undefined && { subcategory: videoData.subcategory }),
      ...(videoData.level && { level: videoData.level }),
      ...(videoData.prerequisites && { prerequisites: videoData.prerequisites }),
      ...(videoData.outcomes && { outcomes: videoData.outcomes }),
      ...(videoData.tags && { tags: videoData.tags }),
      ...(videoData.language && { language: videoData.language }),
      ...(thumbnailResult && { 
        thumbnail: thumbnailResult.secure_url,
        thumbnailAsset: thumbnailResult 
      }),
      ...(videoResult && { 
        videoLink: videoResult.secure_url,
        videoAsset: videoResult,
        duration 
      }),
    });

    console.log(`[UPDATE_VIDEO_ACTION] Video updated successfully: ${videoId}`);

    // Process embeddings asynchronously if embedding-relevant fields changed
    if (hasEmbeddingRelevantChanges) {
      // Fetch the updated video and process embeddings
      const updatedVideo = await Video.findById(videoId);
      if (updatedVideo) {
        processVideoEmbeddingsAsync(updatedVideo, session.user.id);
      }
    }

    revalidatePath('/private/videos');
    revalidatePath('/tutor/videos');
    revalidatePath(`/videos/${videoId}`);
  } catch (error) {
    console.error("Video update error:", error);
    
    // Handle duplicate slug error
    if (error instanceof Error && error.message.includes('E11000') && error.message.includes('slug_1')) {
      throw new Error('A video with this title already exists. Please choose a different title.');
    }
    
    throw new Error(error instanceof Error ? error.message : "Failed to update video");
  }
}

export async function deleteVideo(videoId: string): Promise<void> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized - Please sign in');
  }

  await connectDB();

  try {
    const video = await Video.findById(videoId);
    
    if (!video) {
      throw new Error('Video not found');
    }

    // Check if user owns the video
    if (video.userId.toString() !== session.user.id) {
      throw new Error('Unauthorized - You can only delete your own videos');
    }

    // Delete Cloudinary assets first
    const deletePromises = [];
    
    if (video.thumbnailAsset?.public_id) {
      console.log(`[DELETE_VIDEO_ACTION] Deleting thumbnail from Cloudinary: ${video.thumbnailAsset.public_id}`);
      deletePromises.push(deleteAsset(video.thumbnailAsset.public_id, 'image'));
    }
    
    if (video.videoAsset?.public_id) {
      console.log(`[DELETE_VIDEO_ACTION] Deleting video from Cloudinary: ${video.videoAsset.public_id}`);
      deletePromises.push(deleteAsset(video.videoAsset.public_id, 'video'));
    }
    
    // Execute Cloudinary deletions
    if (deletePromises.length > 0) {
      console.log(`[DELETE_VIDEO_ACTION] Executing ${deletePromises.length} Cloudinary deletion(s)`);
      const results = await Promise.allSettled(deletePromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const assetType = index === 0 ? 'thumbnail' : 'video';
          console.log(`[DELETE_VIDEO_ACTION] Successfully deleted ${assetType} from Cloudinary`);
        } else {
          const assetType = index === 0 ? 'thumbnail' : 'video';
          console.log(`[DELETE_VIDEO_ACTION] Failed to delete ${assetType} from Cloudinary:`, result.reason);
        }
      });
    }

    // Delete embeddings asynchronously before deleting video
    deleteVideoEmbeddingsAsync(videoId, session.user.id);
    
    // Delete the video
    console.log(`[DELETE_VIDEO_ACTION] Deleting video ${videoId} for user ${session.user.id}`);
    await Video.findByIdAndDelete(videoId);

    console.log(`[DELETE_VIDEO_ACTION] Video deleted successfully: ${videoId}`);

    revalidatePath('/private/videos');
    revalidatePath('/tutor/videos');
  } catch (error) {
    console.error("Video deletion error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete video");
  }
}

export async function publishVideo(videoId: string): Promise<void> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized - Please sign in');
  }

  await connectDB();

  try {
    const video = await Video.findById(videoId);
    
    if (!video) {
      throw new Error('Video not found');
    }

    // Check if user owns the video
    if (video.userId.toString() !== session.user.id) {
      throw new Error('Unauthorized - You can only publish your own videos');
    }

    // Update published status
    await Video.findByIdAndUpdate(videoId, { published: true });

    revalidatePath('/private/videos');
    revalidatePath('/tutor/videos');
    revalidatePath(`/videos/${videoId}`);
  } catch (error) {
    console.error("Video publish error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to publish video");
  }
}

export async function unpublishVideo(videoId: string): Promise<void> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized - Please sign in');
  }

  await connectDB();

  try {
    const video = await Video.findById(videoId);
    
    if (!video) {
      throw new Error('Video not found');
    }

    // Check if user owns the video
    if (video.userId.toString() !== session.user.id) {
      throw new Error('Unauthorized - You can only unpublish your own videos');
    }

    // Update published status
    await Video.findByIdAndUpdate(videoId, { published: false });

    revalidatePath('/private/videos');
    revalidatePath('/tutor/videos');
    revalidatePath(`/videos/${videoId}`);
  } catch (error) {
    console.error("Video unpublish error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to unpublish video");
  }
}

export async function addVideoComment(videoId: string, review: string): Promise<void> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized - Please sign in');
  }

  await connectDB();

  try {
    const video = await Video.findById(videoId);
    
    if (!video) {
      throw new Error('Video not found');
    }

    // Add comment
    await Video.findByIdAndUpdate(videoId, {
      $push: {
        comments: {
          userId: new mongoose.Types.ObjectId(session.user.id),
          review,
          createdAt: new Date()
        }
      },
      $inc: { totalComments: 1 }
    });

    revalidatePath(`/videos/${videoId}`);
  } catch (error) {
    console.error("Video comment error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to add comment");
  }
}

export async function incrementVideoViews(videoId: string): Promise<void> {
  await connectDB();

  try {
    await Video.findByIdAndUpdate(videoId, {
      $inc: { views: 1 }
    });
  } catch (error) {
    console.error("Video view increment error:", error);
    // Don't throw error for view increments as it's not critical
  }
}

// Async function to process video embeddings without blocking the response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processVideoEmbeddingsAsync(video: any, userId: string) {
  try {
    console.log(`[CREATE_VIDEO_ACTION] Starting async embedding processing for video ${video._id}`);
    
    // Convert the mongoose document to a plain object for processing
    const videoData = {
      _id: video._id,
      title: video.title,
      subtitle: video.subtitle,
      description: video.description,
      category: video.category,
      subcategory: video.subcategory,
      level: video.level,
      prerequisites: video.prerequisites || [],
      outcomes: video.outcomes || [],
      tags: video.tags || [],
      language: video.language,
      duration: video.duration,
      userId: video.userId,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt
    };
    
    await processVideoEmbedding(videoData, userId);
    console.log(`[CREATE_VIDEO_ACTION] Embedding processing completed for video ${video._id}`);
  } catch (error) {
    console.error(`[CREATE_VIDEO_ACTION] Embedding processing failed for video ${video._id}:`, error);
    // Don't throw - this is async and shouldn't affect the main video creation operation
  }
}

// Async function to delete video embeddings without blocking the response
async function deleteVideoEmbeddingsAsync(videoId: string, userId: string) {
  try {
    console.log(`[DELETE_VIDEO_ACTION] Starting async embedding deletion for video ${videoId}`);
    await deleteVideoEmbedding(videoId, userId);
    console.log(`[DELETE_VIDEO_ACTION] Embedding deletion completed for video ${videoId}`);
  } catch (error) {
    console.error(`[DELETE_VIDEO_ACTION] Embedding deletion failed for video ${videoId}:`, error);
    // Don't throw - this is async and shouldn't affect the main video deletion operation
  }
}