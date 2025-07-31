'use server';

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { uploadImage, uploadVideo, CloudinaryUploadResult } from "@/lib/cloudinary";

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

export interface CourseFormData {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  thumbnail: string | null; // base64 string from client
  previewVideo: string | null; // base64 string from client
  thumbnailAsset?: CloudinaryAsset; // Add support for direct Cloudinary uploads
  previewVideoAsset?: CloudinaryAsset; // Add support for direct Cloudinary uploads
  certificate: boolean;
}

export interface SectionData {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: LessonData[];
}

export interface LessonData {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'article' | 'resource';
  videoLink?: string;
  assignmentLink?: string;
  assignmentDescription?: string;
  content?: string;
}

export interface PricingData {
  basePrice: string;
  hasDiscount: boolean;
  discountPrice: string;
  discountEnds: string;
  isFree: boolean;
}

export async function createCourse({
  courseData,
  sections,
  pricing
}: {
  courseData: CourseFormData;
  sections: SectionData[];
  pricing: PricingData;
}): Promise<string> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized - Please sign in');
  }

  // Check if user has tutor role
  if (session.user.role !== 'tutor') {
    throw new Error('Unauthorized - Tutor access required');
  }

  await connectDB();

  try {
    // Validate all sections have required fields before continuing
    if (!sections || sections.length === 0) {
      throw new Error('At least one course section is required');
    }

    // Validate each section has a title
    const invalidSections = sections.filter(section => !section.title?.trim());
    if (invalidSections.length > 0) {
      throw new Error(`Section ${invalidSections[0].id || 'unknown'} is missing a title`);
    }
    
    // Filter out any empty sections or sections with missing required fields
    const validSections = sections.filter(section => {
      // Check that section has title and it's not just whitespace
      return section.title?.trim();
    });

    // Set up variables for Cloudinary assets
    let thumbnailResult: CloudinaryUploadResult | null = null;
    let previewVideoResult: CloudinaryUploadResult | null = null;

    // Priority 1: Use the direct Cloudinary upload results if available
    if (courseData.thumbnailAsset) {
      thumbnailResult = {
        public_id: courseData.thumbnailAsset.public_id,
        secure_url: courseData.thumbnailAsset.secure_url,
        resource_type: courseData.thumbnailAsset.resource_type as 'image' | 'video' | 'raw',
        format: courseData.thumbnailAsset.format,
        width: courseData.thumbnailAsset.width,
        height: courseData.thumbnailAsset.height,
        bytes: courseData.thumbnailAsset.bytes,
        created_at: new Date()
      };
    }
    
    if (courseData.previewVideoAsset) {
      previewVideoResult = {
        public_id: courseData.previewVideoAsset.public_id,
        secure_url: courseData.previewVideoAsset.secure_url,
        resource_type: courseData.previewVideoAsset.resource_type as 'image' | 'video' | 'raw',
        format: courseData.previewVideoAsset.format,
        duration: courseData.previewVideoAsset.duration,
        bytes: courseData.previewVideoAsset.bytes,
        width: courseData.previewVideoAsset.width,
        height: courseData.previewVideoAsset.height,
        created_at: new Date()
      };
    }
    
    // Priority 2: Upload files to Cloudinary only if we don't already have assets
    if (!thumbnailResult && courseData.thumbnail) {
      thumbnailResult = await uploadImage(courseData.thumbnail, 'courses/thumbnails');
    }

    if (!previewVideoResult && courseData.previewVideo) {
      previewVideoResult = await uploadVideo(courseData.previewVideo, 'courses/previews');
    }

    // Generate a slug from the title
    const slug = courseData.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Prepare pricing data
    const price = pricing.isFree ? 0 : parseFloat(pricing.basePrice) || 0;
    const discountedPrice = pricing.hasDiscount ? parseFloat(pricing.discountPrice) || 0 : undefined;
    const discountEnds = pricing.hasDiscount ? new Date(pricing.discountEnds) : undefined;

    // Process sections and lessons - ensure all have required fields
    const processedSections = validSections.map((section, index) => {
      // Ensure each section has a valid description
      const description = section.description || '';
      
      // Filter out lessons with missing titles
      const validLessons = (section.lessons || []).filter(lesson => lesson.title?.trim());
      
      // Process valid lessons
      const processedLessons = validLessons.map(lesson => ({
        title: lesson.title.trim(),
        description: lesson.description || '',
        duration: lesson.duration || '0:00',
        type: lesson.type || 'video',
        videoLink: lesson.videoLink || '',
        assignmentLink: lesson.assignmentLink || '',
        assignmentDescription: lesson.assignmentDescription || '',
      }));
      
      return {
        title: section.title.trim(),
        description,
        order: index,
        lessons: processedLessons
      };
    });

    // Create the course using Mongoose
    const course = await Course.create({
      title: courseData.title,
      subtitle: courseData.subtitle || '',
      slug,
      description: courseData.description,
      tutorId: new mongoose.Types.ObjectId(session.user.id),
      thumbnail: thumbnailResult?.secure_url || '',
      thumbnailAsset: thumbnailResult,
      previewVideo: previewVideoResult?.secure_url || '',
      previewVideoAsset: previewVideoResult,
      price,
      isFree: pricing.isFree,
      discountedPrice,
      discountEnds,
      category: courseData.category,
      level: courseData.level,
      certificate: courseData.certificate,
      sections: processedSections,
      published: false,
      approved: false
    });

    return course._id.toString();
  } catch (error) {
    console.error("Course creation error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create course");
  }
}

export async function publishCourse(courseId: string): Promise<any> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  await connectDB();

  const course = await Course.findById(courseId);

  if (!course) {
    throw new Error('Course not found');
  }

  if (course.tutorId.toString() !== session.user.id) {
    throw new Error('Unauthorized');
  }

  // Validate course before publishing
  if (!course.title || !course.description || !course.thumbnail || course.sections.length === 0) {
    throw new Error('Course is incomplete');
  }

  // Publish the course
  course.published = true;
  await course.save();

  return course;
}

export async function unpublishCourse(courseId: string): Promise<any> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  await connectDB();

  const course = await Course.findById(courseId);

  if (!course) {
    throw new Error('Course not found');
  }

  if (course.tutorId.toString() !== session.user.id) {
    throw new Error('Unauthorized');
  }

  // Unpublish the course
  course.published = false;
  await course.save();

  return course;
}

export async function deleteCourse(courseId: string): Promise<void> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  await connectDB();

  const course = await Course.findById(courseId);

  if (!course) {
    throw new Error('Course not found');
  }

  if (course.tutorId.toString() !== session.user.id) {
    throw new Error('Unauthorized');
  }

  // Delete the course
  await Course.findByIdAndDelete(courseId);
}

export async function updateCourse(courseId: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    await connectDB();

    // Find the course and check permission
    const course = await Course.findOne({ 
      _id: courseId, 
      tutorId: session.user.id 
    });

    if (!course) {
      throw new Error("Course not found or you don't have permission to edit it");
    }

    // Process form data
    // Basic details
    const title = formData.get("title")?.toString();
    if (!title) {
      throw new Error("Course title is required");
    }
    
    const subtitle = formData.get("subtitle")?.toString();
    const description = formData.get("description")?.toString();
    if (!description) {
      throw new Error("Course description is required");
    }
    
    const category = formData.get("category")?.toString();
    if (!category) {
      throw new Error("Course category is required");
    }
    
    const level = formData.get("level")?.toString();
    if (!level) {
      throw new Error("Course level is required");
    }
    
    const certificate = formData.get("certificate")?.toString() === "true";

    // Handle prerequisites and outcomes if present
    const prerequisites = formData.get("prerequisites")
      ? formData.get("prerequisites")?.toString().split("\n").filter(Boolean)
      : undefined;
    
    const outcomes = formData.get("outcomes")
      ? formData.get("outcomes")?.toString().split("\n").filter(Boolean)
      : undefined;

    // Update slug if title has changed
    let slug = course.slug;
    if (title && title !== course.title) {
      slug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Check if slug already exists for another course
      const existingCourse = await Course.findOne({ 
        slug,
        _id: { $ne: courseId }
      });
      
      if (existingCourse) {
        // Add a unique suffix if slug already exists
        slug = `${slug}-${Date.now().toString().slice(-6)}`;
      }
    }

    // Check for section data
    let sections;
    const sectionsData = formData.get("sections")?.toString();
    if (sectionsData) {
      try {
        const parsedSections = JSON.parse(sectionsData);
        sections = parsedSections.map((section: any, index: number) => ({
          title: section.title,
          description: section.description || '',
          order: index,
          lessons: section.lessons.map((lesson: any) => ({
            title: lesson.title,
            description: lesson.description || '',
            duration: lesson.duration || '',
            type: lesson.type || 'video',
            videoLink: lesson.videoLink || '',
            assignmentLink: lesson.assignmentLink || '',
            assignmentDescription: lesson.assignmentDescription || '',
          }))
        }));
      } catch (error) {
        console.error("Error parsing sections:", error);
        throw new Error("Invalid curriculum data format");
      }
    }

    // Check for pricing data
    let price = course.price;
    let isFree = course.isFree;
    let discountedPrice = course.discountedPrice;
    let discountEnds = course.discountEnds;

    const pricingData = formData.get("pricing")?.toString();
    if (pricingData) {
      try {
        const pricing = JSON.parse(pricingData);
        isFree = pricing.isFree;
        price = isFree ? 0 : parseFloat(pricing.basePrice) || 0;
        
        if (pricing.hasDiscount) {
          discountedPrice = parseFloat(pricing.discountPrice) || undefined;
          discountEnds = pricing.discountEnds ? new Date(pricing.discountEnds) : undefined;
        } else {
          discountedPrice = undefined;
          discountEnds = undefined;
        }
      } catch (error) {
        console.error("Error parsing pricing:", error);
        throw new Error("Invalid pricing data format");
      }
    }

    // Handle media assets
    let thumbnailAsset = course.thumbnailAsset;
    let previewVideoAsset = course.previewVideoAsset;

    // Check for thumbnailAsset data
    const thumbnailAssetData = formData.get("thumbnailAsset")?.toString();
    if (thumbnailAssetData) {
      try {
        thumbnailAsset = JSON.parse(thumbnailAssetData);
      } catch (error) {
        console.error("Error parsing thumbnailAsset:", error);
        throw new Error("Invalid thumbnail asset data");
      }
    }

    // Check for previewVideoAsset data
    const previewVideoAssetData = formData.get("previewVideoAsset")?.toString();
    if (previewVideoAssetData) {
      try {
        previewVideoAsset = JSON.parse(previewVideoAssetData);
      } catch (error) {
        console.error("Error parsing previewVideoAsset:", error);
        throw new Error("Invalid preview video asset data");
      }
    }

    // Process thumbnail and previewVideo files
    const thumbnail = formData.get("thumbnail");
    if (thumbnail && thumbnail instanceof Blob && thumbnail.size > 0) {
      try {
        const base64Image = await fileToBase64(thumbnail as any);
        if (base64Image) {
          const newThumbnailAsset = await uploadImage(base64Image, "courses/thumbnails");
          thumbnailAsset = newThumbnailAsset;
        }
      } catch (error) {
        console.error("Error uploading thumbnail:", error);
        // Log but don't throw to allow the update to continue without new image
      }
    }

    const previewVideo = formData.get("previewVideo");
    if (previewVideo && previewVideo instanceof Blob && previewVideo.size > 0) {
      try {
        const base64Video = await fileToBase64(previewVideo as any);
        if (base64Video) {
          const newVideoAsset = await uploadVideo(base64Video, "courses/previews");
          previewVideoAsset = newVideoAsset;
        }
      } catch (error) {
        console.error("Error uploading preview video:", error);
        // Log but don't throw to allow the update to continue without new video
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    // Only include fields that are provided
    if (title) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (level) updateData.level = level;
    if (certificate !== undefined) updateData.certificate = certificate;
    if (prerequisites) updateData.prerequisites = prerequisites;
    if (outcomes) updateData.outcomes = outcomes;
    if (sections) updateData.sections = sections;
    if (price !== undefined) updateData.price = price;
    if (isFree !== undefined) updateData.isFree = isFree;
    if (discountedPrice !== undefined) updateData.discountedPrice = discountedPrice;
    if (discountEnds !== undefined) updateData.discountEnds = discountEnds;
    if (slug && slug !== course.slug) updateData.slug = slug;
    if (thumbnailAsset) {
      updateData.thumbnailAsset = thumbnailAsset;
      updateData.thumbnail = thumbnailAsset.secure_url;
    }
    if (previewVideoAsset) {
      updateData.previewVideoAsset = previewVideoAsset;
      updateData.previewVideo = previewVideoAsset.secure_url;
    }

    console.log("Updating course with data:", {
      courseId,
      title: updateData.title,
      category: updateData.category,
      hasThumbnail: !!updateData.thumbnail,
      hasPreviewVideo: !!updateData.previewVideo,
      sectionsCount: sections ? sections.length : 'unchanged'
    });

    // Update the course with proper error handling and sanitization
    try {
      // First, sanitize sections to ensure they don't have any circular references or invalid data
      if (updateData.sections) {
        updateData.sections = updateData.sections.map((section: any) => {
          return {
            title: String(section.title || ''),
            description: String(section.description || ''),
            order: Number(section.order || 0),
            lessons: Array.isArray(section.lessons) ? section.lessons.map((lesson: any) => ({
              title: String(lesson.title || ''),
              description: String(lesson.description || ''),
              duration: String(lesson.duration || '0:00'),
              type: lesson.type === 'video' || lesson.type === 'article' || lesson.type === 'resource' 
                ? lesson.type 
                : 'video',
              videoLink: String(lesson.videoLink || ''),
              assignmentLink: String(lesson.assignmentLink || ''),
              assignmentDescription: String(lesson.assignmentDescription || '')
            })) : []
          };
        });
      }
      
      // Sanitize cloudinary assets to ensure they don't have any circular references
      if (updateData.thumbnailAsset) {
        updateData.thumbnailAsset = {
          public_id: String(updateData.thumbnailAsset.public_id || ''),
          secure_url: String(updateData.thumbnailAsset.secure_url || ''),
          resource_type: String(updateData.thumbnailAsset.resource_type || 'image'),
          format: String(updateData.thumbnailAsset.format || ''),
          width: Number(updateData.thumbnailAsset.width || 0),
          height: Number(updateData.thumbnailAsset.height || 0),
          bytes: Number(updateData.thumbnailAsset.bytes || 0)
        };
      }
      
      if (updateData.previewVideoAsset) {
        updateData.previewVideoAsset = {
          public_id: String(updateData.previewVideoAsset.public_id || ''),
          secure_url: String(updateData.previewVideoAsset.secure_url || ''),
          resource_type: String(updateData.previewVideoAsset.resource_type || 'video'),
          format: String(updateData.previewVideoAsset.format || ''),
          duration: Number(updateData.previewVideoAsset.duration || 0),
          width: Number(updateData.previewVideoAsset.width || 0),
          height: Number(updateData.previewVideoAsset.height || 0),
          bytes: Number(updateData.previewVideoAsset.bytes || 0)
        };
      }
      
      // Use a lean, plain JavaScript object approach to avoid Mongoose conversion issues
      // This helps prevent stack overflow by avoiding deep object traversal during serialization
      const cleanUpdateData = JSON.parse(JSON.stringify(updateData));
      
      // Update the course with the sanitized data
      const updatedCourse = await Course.findOneAndUpdate(
        { _id: courseId, tutorId: session.user.id },
        { $set: cleanUpdateData },
        { new: true, runValidators: false } // Disable validators to prevent deep traversal
      );

      if (!updatedCourse) {
        throw new Error("Failed to update course");
      }

      // Revalidate the course pages to reflect changes
      revalidatePath(`/tutor/courses/${courseId}`);
      revalidatePath(`/tutor/courses/${courseId}/edit`);
      revalidatePath('/tutor/courses');

      return { success: true };
    } catch (mongoError) {
      console.error("MongoDB update error:", mongoError);
      throw new Error("Failed to save course data");
    }
  } catch (error) {
    console.error("[UPDATE_COURSE_ERROR]", error);
    throw error; // Just throw the original error to preserve the message
  }
}

// Helper function to convert File to base64
async function fileToBase64(file: any): Promise<string | null> {
  return new Promise((resolve, reject) => {
    try {
      if (!file || !(file instanceof Blob)) {
        console.log("File is not a valid Blob object");
        resolve(null);
        return;
      }
      
      // Create a new FileReader
      const reader = new FileReader();
      
      // Set up onload handler
      reader.onload = () => {
        try {
          const result = reader.result as string;
          resolve(result);
        } catch (err) {
          console.error("Error in FileReader onload:", err);
          resolve(null);
        }
      };
      
      // Set up error handler
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        resolve(null); // Resolve with null instead of rejecting to avoid crashes
      };
      
      // Start reading
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error in fileToBase64:", error);
      resolve(null); // Resolve with null instead of rejecting to avoid crashes
    }
  });
}