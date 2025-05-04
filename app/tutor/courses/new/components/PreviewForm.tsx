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
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface PreviewFormProps {
  courseData: {
    title: string;
    subtitle: string;
    description: string;
    category: string;
    level: string;
    thumbnail: string | null;
    previewVideo: string | null;
    certificate: boolean;
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
  courseId?: string; // Add courseId for existing courses
}

export default function PreviewForm({ courseData, onBack, onPublish, isSubmitting, courseId }: PreviewFormProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  
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
    
  // Separate function to handle the publish action specifically
  const handlePublish = async () => {
    if (!courseId) {
      // For new courses, just use the standard onPublish
      await onPublish();
      return;
    }
    
    try {
      setIsPublishing(true);
      
      // Call the publish API endpoint
      const response = await fetch(`/api/courses/${courseId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish course');
      }
      
      toast.success('Course published successfully!');
      
      // Refresh the page to see updated status
      window.location.href = `/tutor/courses/${courseId}`;
    } catch (error: any) {
      console.error('Publish error:', error);
      toast.error(error.message || 'Failed to publish course. Please try again.');
    } finally {
      setIsPublishing(false);
    }
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
          {courseData.thumbnail ? (
            <img
              src={courseData.thumbnail}
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
                    <span>Access on mobile and TV</span>
                  </div>
                  {courseData.certificate && (
                    <div className="flex items-center text-gray-400">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                      <span>Certificate of completion</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-3"
                  onClick={onPublish}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Course'
                  )}
                </Button>
                
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
              </div>
            </Card>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-gray-800 text-gray-400"
          >
            Back
          </Button>
          <Button
            onClick={onPublish}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {courseId ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                {courseId ? 'Update Course' : 'Create Course'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}