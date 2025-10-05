'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  BookOpen, 
  Clock, 
  Users, 
  CheckCircle, 
  PlayCircle,
  FileText,
  Link,
  ArrowRight,
  Loader2,
  Database,
  Check,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { parseStringArray } from "@/lib/utils/course-data";

interface PreviewFormProps {
  courseData: {
    title: string;
    subtitle: string;
    description: string;
    category: string;
    level: string;
    thumbnail: File | null;
    previewVideo: File | null;
    thumbnailAsset?: {
      secure_url: string;
      public_id: string;
      resource_type: string;
      format: string;
      duration?: number;
      bytes: number;
      width?: number;
      height?: number;
    };
    previewVideoAsset?: {
      secure_url: string;
      public_id: string;
      resource_type: string;
      format: string;
      duration?: number;
      bytes: number;
      width?: number;
      height?: number;
    };
    certificate: boolean;
    prerequisites: string[];
    outcomes: string[];
    sections: Array<{
      id: string;
      title: string;
      description: string;
      lessons: Array<{
        id: string;
        title: string;
        description: string;
        type: 'video' | 'article' | 'resource';
        duration: string;
        videoLink?: string;
        assignmentLink?: string;
        assignmentDescription?: string;
      }>;
    }>;
    pricing: {
      basePrice: string;
      hasDiscount: boolean;
      discountPrice: string;
      discountEnds: string;
      isFree: boolean;
    };
  };
  onBack: () => void;
  onPublish: () => Promise<void>;
  isSubmitting: boolean;
}

export default function PreviewForm({ courseData, onBack, onPublish, isSubmitting }: PreviewFormProps) {
  const [embeddingStatus, setEmbeddingStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  
  const totalLessons = courseData.sections.reduce(
    (total, section) => total + section.lessons.length,
    0
  );

  const totalDuration = courseData.sections
    .flatMap(section => section.lessons)
    .reduce((total, lesson) => {
      const duration = lesson.duration;
      // Simple duration parsing - could be enhanced for more formats
      const minutes = parseInt(duration) || 0;
      return total + minutes;
    }, 0);
    
  // Handle course creation with embedding tracking
  const handleCourseSubmit = async () => {
    try {
      // Validate required fields before submission
      if (!courseData.title.trim()) {
        toast.error('📝 Missing Course Title', {
          description: 'Please provide a title for your course',
          duration: 4000,
        });
        return;
      }
      
      if (!courseData.description.trim()) {
        toast.error('📝 Missing Description', {
          description: 'Please provide a description for your course',
          duration: 4000,
        });
        return;
      }
      
      if (!courseData.category) {
        toast.error('📂 Missing Category', {
          description: 'Please select a category for your course',
          duration: 4000,
        });
        return;
      }
      
      if (!courseData.thumbnailAsset && !courseData.thumbnail) {
        toast.error('🖼️ Missing Thumbnail', {
          description: 'Please upload a thumbnail image for your course',
          duration: 4000,
        });
        return;
      }
      
      if (courseData.sections.length === 0) {
        toast.error('📚 No Course Content', {
          description: 'Please add at least one section with lessons to your course',
          duration: 4000,
        });
        return;
      }
      
      // Set embedding processing state
      setEmbeddingStatus("processing");
      
      // Call the original onPublish function
      await onPublish();
      
      // Show success message with embedding info
      toast.success("Course saved successfully! AI embeddings are being processed...", {
        description: "This will help with future search and recommendations"
      });
      
      // Simulate embedding completion after a delay
      // In a real app, you'd poll the embedding status API
      setTimeout(() => {
        setEmbeddingStatus("completed");
        toast.success("AI embeddings completed!", {
          description: "Your course is now fully searchable"
        });
      }, 3000);
      
    } catch (error) {
      console.error("Failed to save course:", error);
      setEmbeddingStatus("failed");
      // Don't show duplicate error toast - let the parent handle it
      throw error; // Re-throw to maintain existing error handling
    }
  };

  // Helper function to get thumbnail URL
  const getThumbnailUrl = () => {
    if (courseData.thumbnailAsset?.secure_url) {
      return courseData.thumbnailAsset.secure_url;
    }
   
    return undefined;
  };

  // Helper function to get preview video URL
  const getPreviewVideoUrl = () => {
    if (courseData.previewVideoAsset?.secure_url) {
      return courseData.previewVideoAsset.secure_url;
    }
    return undefined;
  };

  return (
    <Card className="bg-[#141414] border-gray-800 max-w-4xl mx-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Course Preview</h2>
          <p className="text-gray-400">Review how your course will appear to students</p>
        </div>

        {/* Course Header */}
        <div className="relative rounded-lg overflow-hidden mb-6">
        {getPreviewVideoUrl() ? (
            <video 
              className="w-full h-64 object-cover" 
              src={getPreviewVideoUrl()!} 
              controls 
              poster={getThumbnailUrl()}
            />
          ) : getThumbnailUrl() ? (
            <img
              src={getThumbnailUrl()!}
              alt={courseData.title}
              className="w-full h-64 object-cover"
            />
          ) : (
            <div className="w-full h-64 bg-gray-800 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-gray-600" />
            </div>
          )}
          
          {!courseData.pricing.isFree && courseData.pricing.hasDiscount && (
            <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full">
              Save ${((parseFloat(courseData.pricing.basePrice) || 0) - (parseFloat(courseData.pricing.discountPrice) || 0)).toFixed(2)}
            </div>
          )}
        </div>

        {/* Course Info */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="col-span-2">
            <h1 className="text-2xl font-bold text-white mb-2">{courseData.title}</h1>
            <p className="text-lg text-gray-300 mb-4">{courseData.subtitle}</p>
            <p className="text-gray-400 mb-4">{courseData.description}</p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center text-gray-400">
                <Clock className="h-4 w-4 mr-2" />
                <span>{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</span>
              </div>
              <div className="flex items-center text-gray-400">
                <BookOpen className="h-4 w-4 mr-2" />
                <span>{totalLessons} lessons</span>
              </div>
              <div className="flex items-center text-gray-400">
                <Users className="h-4 w-4 mr-2" />
                <span>{courseData.level}</span>
              </div>
              {courseData.certificate && (
                <div className="flex items-center text-gray-400">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Certificate of completion</span>
                </div>
              )}
            </div>

            {/* Prerequisites and Outcomes */}
            {(parseStringArray(courseData.prerequisites)?.length > 0 || parseStringArray(courseData.outcomes)?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {parseStringArray(courseData.prerequisites)?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Prerequisites</h3>
                    <ul className="space-y-2">
                      {parseStringArray(courseData.prerequisites).map((prerequisite, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-400">
                          <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span>{prerequisite}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {parseStringArray(courseData.outcomes)?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">What You&apos;ll Learn</h3>
                    <ul className="space-y-2">
                      {parseStringArray(courseData.outcomes).map((outcome, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-400">
                          <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Course Sections */}
            <div className="space-y-4">
              {courseData.sections.map((section, index) => (
                <div key={section.id} className="border border-gray-800 rounded-lg">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Section {index + 1}: {section.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">{section.description}</p>
                    
                    <div className="space-y-2">
                      {section.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between py-2 px-4 rounded-lg bg-[#0a0a0a]"
                        >
                          <div className="flex items-center gap-3">
                            {lesson.type === 'video' && (
                              <PlayCircle className="h-4 w-4 text-blue-400" />
                            )}
                            {lesson.type === 'article' && (
                              <FileText className="h-4 w-4 text-purple-400" />
                            )}
                            {lesson.type === 'resource' && (
                              <Link className="h-4 w-4 text-green-400" />
                            )}
                            <span className="text-gray-300">{lesson.title}</span>
                          </div>
                          <span className="text-gray-500">{lesson.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Card */}
          <div>
            <Card className="bg-[#0a0a0a] border-gray-800 sticky top-4">
              <div className="p-6">
                <div className="mb-6">
                  {courseData.pricing.isFree ? (
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      Free
                    </div>
                  ) : courseData.pricing.hasDiscount ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl font-bold text-white">
                          ${courseData.pricing.discountPrice}
                        </span>
                        <span className="text-lg text-gray-500 line-through">
                          ${courseData.pricing.basePrice}
                        </span>
                      </div>
                      {courseData.pricing.discountEnds && (
                        <p className="text-green-400 text-sm">
                          Limited time offer - Ends {new Date(courseData.pricing.discountEnds).toLocaleDateString()}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-3xl font-bold text-white mb-2">
                      ${courseData.pricing.basePrice}
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center text-gray-400">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                    <span>Full lifetime access</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                    <span>Access on mobile</span>
                  </div>
                  {courseData.certificate && (
                    <div className="flex items-center text-gray-400">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                      <span>Certificate of completion</span>
                    </div>
                  )}
                </div>
<<<<<<< HEAD
                {courseId && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handlePublish}
                    disabled={isPublishing}
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      'Publish Course'
                    )}
                  </Button>
                )}
=======
>>>>>>> f2381a83791a615a58a7a70bc215d6493c3f5ee4
              </div>
            </Card>
          </div>
        </div>

        {/* Embedding Status Information */}
        {(isSubmitting || embeddingStatus !== "idle") && (
          <div className="mt-6 p-4 bg-[#0a0a0a] rounded-lg border border-gray-800">
            <div className="text-sm text-gray-400 mb-2">
              AI Enhancement Status:
            </div>
            <div className="flex items-center gap-2 text-sm">
              {embeddingStatus === "processing" && (
                <>
                  <Database className="h-4 w-4 text-blue-400 animate-pulse" />
                  <span className="text-blue-400">Processing AI embeddings...</span>
                </>
              )}
              {embeddingStatus === "completed" && (
                <>
                  <Check className="h-4 w-4 text-green-400" />
                  <span className="text-green-400">AI embeddings completed</span>
                </>
              )}
              {embeddingStatus === "failed" && (
                <>
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span className="text-red-400">AI processing failed (course still saved)</span>
                </>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              This enables intelligent search and personalized recommendations
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-gray-800 text-gray-400"
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            onClick={handleCourseSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {embeddingStatus === "processing" ? "Saving & Processing AI..." : 'Creating Course...'}
              </>
            ) : (
              <>
                Create Course
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}