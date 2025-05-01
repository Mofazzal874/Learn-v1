'use server';

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

export async function createCourse(data: {
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  thumbnail?: string;
  previewVideo?: string;
  price: number;
  discountedPrice?: number;
  prerequisites?: string[];
  outcomes?: string[];
  requirements?: string[];
  sections: Array<{
    title: string;
    description?: string;
    order: number;
    lessons: Array<{
      title: string;
      description?: string;
      videoUrl?: string;
      duration?: number;
      resources?: Array<{
        title: string;
        url: string;
        type: 'pdf' | 'link' | 'zip' | 'other';
      }>;
      quiz?: Array<{
        question: string;
        options: string[];
        correctAnswer: number;
        explanation?: string;
      }>;
    }>;
  }>;
  tags?: string[];
  language?: string;
  welcomeMessage?: string;
  completionMessage?: string;
}): Promise<any> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  await connectDB();

  // Generate a slug from the title
  const slug = data.title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Create the course using Mongoose
  const course = await Course.create({
    ...data,
    slug,
    tutorId: new mongoose.Types.ObjectId(session.user.id),
    published: false,
    approved: false,
    rating: 0,
    totalStudents: 0,
    totalReviews: 0
  });

  return course;
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

    // Convert prerequisites and outcomes from newline-separated text to arrays
    const prerequisites = formData.get("prerequisites")?.toString().split("\n").filter(Boolean) || [];
    const outcomes = formData.get("outcomes")?.toString().split("\n").filter(Boolean) || [];

    const updatedData = {
      title: formData.get("title"),
      category: formData.get("category"),
      price: parseFloat(formData.get("price")?.toString() || "0"),
      level: formData.get("level"),
      description: formData.get("description"),
      prerequisites,
      outcomes,
      updatedAt: new Date()
    };

    const course = await Course.findOneAndUpdate(
      { _id: courseId, tutorId: session.user.id },
      { $set: updatedData },
      { new: true }
    );

    if (!course) {
      throw new Error("Course not found or you don't have permission to edit it");
    }

    // Revalidate the course pages to reflect changes
    revalidatePath(`/tutor/courses/${courseId}`);
    revalidatePath(`/tutor/courses/${courseId}/edit`);
    revalidatePath('/tutor/courses');

    return { success: true, course };
  } catch (error) {
    console.error("[UPDATE_COURSE_ERROR]", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update course");
  }
}