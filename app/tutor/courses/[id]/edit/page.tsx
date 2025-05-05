'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CurriculumForm from '../../new/components/CurriculumForm';
import PricingForm from '../../new/components/PricingForm';
import PreviewForm from '../../new/components/PreviewForm';
import BasicDetailsForm from '../../new/components/BasicDetailsForm';
import { toast } from 'sonner';
import { updateCourse } from '@/app/actions/course';
import { Loader2 } from 'lucide-react';
import connectDB from '@/lib/db';
import { Course } from '@/models/Course';

interface CloudinaryAsset {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  duration?: number;
  bytes: number;
  width?: number;
  height?: number;
}

interface CourseFormData {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  thumbnail: File | null;
  previewVideo: File | null;
  thumbnailAsset?: CloudinaryAsset;
  previewVideoAsset?: CloudinaryAsset;
  certificate: boolean;
}

interface Section {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Lesson {
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

interface PricingData {
  basePrice: string;
  hasDiscount: boolean;
  discountPrice: string;
  discountEnds: string;
  isFree: boolean;
}

export default function EditCoursePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseFormData>({
    title: '',
    subtitle: '',
    description: '',
    category: '',
    level: '',
    thumbnail: null,
    previewVideo: null,
    certificate: false,
  });
  const [curriculumData, setCurriculumData] = useState<Section[]>([]);
  const [pricingData, setPricingData] = useState<PricingData>({
    basePrice: '',
    hasDiscount: false,
    discountPrice: '',
    discountEnds: '',
    isFree: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch course data
  useEffect(() => {
    async function fetchCourse() {
      try {
        const response = await fetch(`/api/courses/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch course');
        }
        const data = await response.json();
        setCourse(data);

        // Initialize form data with existing course data
        setCourseData({
          title: data.title || '',
          subtitle: data.subtitle || '',
          description: data.description || '',
          category: data.category || '',
          level: data.level || '',
          thumbnail: null,
          previewVideo: null,
          thumbnailAsset: data.thumbnailAsset || undefined,
          previewVideoAsset: data.previewVideoAsset || undefined,
          certificate: data.certificate || false,
        });

        // Initialize curriculum data
        if (data.sections && Array.isArray(data.sections)) {
          const formattedSections = data.sections.map((section: any) => ({
            id: section._id || String(Math.random()),
            title: section.title || '',
            description: section.description || '',
            lessons: section.lessons?.map((lesson: any) => ({
              id: lesson._id || String(Math.random()),
              title: lesson.title || '',
              description: lesson.description || '',
              duration: lesson.duration || '',
              type: lesson.type || 'video',
              videoLink: lesson.videoLink || '',
              assignmentLink: lesson.assignmentLink || '',
              assignmentDescription: lesson.assignmentDescription || '',
            })) || [],
          }));
          setCurriculumData(formattedSections);
        }

        // Initialize pricing data
        setPricingData({
          basePrice: data.price?.toString() || '0',
          hasDiscount: !!data.discountedPrice,
          discountPrice: data.discountedPrice?.toString() || '',
          discountEnds: data.discountEnds ? new Date(data.discountEnds).toISOString().slice(0, 16) : '',
          isFree: data.isFree || false,
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error('Failed to load course data');
        router.push('/tutor/courses');
      }
    }

    fetchCourse();
  }, [params.id, router]);

  // Add a useEffect cleanup for object URLs to prevent memory leaks
  useEffect(() => {
    // Clean up any created object URLs on component unmount
    return () => {
      // Clean up any object URLs that might have been created
      if (courseData.thumbnail instanceof File) {
        URL.revokeObjectURL(URL.createObjectURL(courseData.thumbnail));
      }
      if (courseData.previewVideo instanceof File) {
        URL.revokeObjectURL(URL.createObjectURL(courseData.previewVideo));
      }
    };
  }, []);

  const handleSaveBasicDetails = (data: CourseFormData) => {
    setCourseData(data);
    setCurrentStep(1);
  };

  const handleSaveCurriculum = (sections: Section[]) => {
    setCurriculumData(sections);
  };

  const handleSavePricing = (pricing: PricingData) => {
    setPricingData(pricing);
  };

  const handleUpdate = async () => {
    try {
      setIsSubmitting(true);
      
      // Create a FormData object to send to the server
      const formData = new FormData();
      
      // Basic details - required fields
      formData.append('title', courseData.title || '');
      formData.append('subtitle', courseData.subtitle || '');
      formData.append('description', courseData.description || '');
      formData.append('category', courseData.category || '');
      formData.append('level', courseData.level || '');
      formData.append('certificate', String(courseData.certificate || false));
      
      // Handle thumbnail and video assets - ensure we only send valid JSON data
      if (courseData.thumbnailAsset) {
        // Only include essential fields to avoid circular references
        const simpleThumbAsset = {
          secure_url: courseData.thumbnailAsset.secure_url,
          public_id: courseData.thumbnailAsset.public_id,
          resource_type: courseData.thumbnailAsset.resource_type,
          format: courseData.thumbnailAsset.format,
          bytes: courseData.thumbnailAsset.bytes,
          width: courseData.thumbnailAsset.width,
          height: courseData.thumbnailAsset.height
        };
        formData.append('thumbnailAsset', JSON.stringify(simpleThumbAsset));
      }
      
      if (courseData.previewVideoAsset) {
        // Only include essential fields to avoid circular references
        const simpleVideoAsset = {
          secure_url: courseData.previewVideoAsset.secure_url,
          public_id: courseData.previewVideoAsset.public_id,
          resource_type: courseData.previewVideoAsset.resource_type,
          format: courseData.previewVideoAsset.format,
          bytes: courseData.previewVideoAsset.bytes,
          duration: courseData.previewVideoAsset.duration,
          width: courseData.previewVideoAsset.width,
          height: courseData.previewVideoAsset.height
        };
        formData.append('previewVideoAsset', JSON.stringify(simpleVideoAsset));
      }
      
      // Add files only if they're valid File objects with size > 0
      if (courseData.thumbnail instanceof File && courseData.thumbnail.size > 0) {
        formData.append('thumbnail', courseData.thumbnail);
      }
      
      if (courseData.previewVideo instanceof File && courseData.previewVideo.size > 0) {
        formData.append('previewVideo', courseData.previewVideo);
      }
      
      // Add sections and lessons - handle circular references by creating simple objects
      if (curriculumData && curriculumData.length > 0) {
        const simpleSections = curriculumData.map(section => ({
          title: section.title || '',
          description: section.description || '',
          lessons: section.lessons.map(lesson => ({
            title: lesson.title || '',
            description: lesson.description || '',
            duration: lesson.duration || '',
            type: lesson.type || 'video',
            videoLink: lesson.videoLink || '',
            assignmentLink: lesson.assignmentLink || '',
            assignmentDescription: lesson.assignmentDescription || ''
          }))
        }));
        formData.append('sections', JSON.stringify(simpleSections));
      }
      
      // Add pricing data as a simple object
      const simplePricing = {
        basePrice: pricingData.basePrice || '0',
        hasDiscount: Boolean(pricingData.hasDiscount),
        discountPrice: pricingData.discountPrice || '',
        discountEnds: pricingData.discountEnds || '',
        isFree: Boolean(pricingData.isFree)
      };
      formData.append('pricing', JSON.stringify(simplePricing));
      
      console.log('Submitting course update...');
      
      try {
        // Call the update course action
        const result = await updateCourse(params.id, formData);
        
        toast.success('Course updated successfully!');
        router.push(`/tutor/courses/${params.id}`);
      } catch (apiError) {
        console.error('API error:', apiError);
        const errorMessage = apiError instanceof Error ? apiError.message : 'Server error occurred. Please try again.';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update course. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Card className="bg-[#141414] border-gray-800 p-8">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
            <p className="text-white">Loading course information...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Edit Course</h1>
          <p className="text-gray-400 mt-2">Update your course information</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 bg-gray-800" />
          {['Course Details', 'Curriculum', 'Pricing', 'Preview'].map((step, index) => (
            <div key={step} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index === currentStep 
                  ? 'bg-blue-600 text-white' 
                  : index < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-400'}`}
              >
                {index + 1}
              </div>
              <span className={`text-sm ${index === currentStep ? 'text-white' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Form Steps */}
        {currentStep === 0 && (
          <BasicDetailsForm 
            initialData={courseData}
            onSave={handleSaveBasicDetails}
          />
        )}

        {currentStep === 1 && (
          <CurriculumForm
            initialData={curriculumData}
            onSave={handleSaveCurriculum}
            onBack={() => setCurrentStep(0)}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <PricingForm
            initialData={pricingData}
            onSave={handleSavePricing}
            onBack={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 3 && (
          <PreviewForm
            courseData={{
              title: courseData.title,
              subtitle: courseData.subtitle,
              description: courseData.description,
              category: courseData.category,
              level: courseData.level,
              certificate: courseData.certificate,
              sections: curriculumData,
              pricing: pricingData,
              // Use existing thumbnail and preview URLs without createObjectURL which can cause memory issues
              thumbnail: courseData.thumbnailAsset?.secure_url || null,
              previewVideo: courseData.previewVideoAsset?.secure_url || null
            }}
            courseId={params.id}
            onBack={() => setCurrentStep(2)}
            onPublish={handleUpdate}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}