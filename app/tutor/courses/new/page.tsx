'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CurriculumForm from './components/CurriculumForm';
import PricingForm from './components/PricingForm';
import PreviewForm from './components/PreviewForm';
import BasicDetailsForm from './components/BasicDetailsForm';
import { toast } from 'sonner';
import { createCourse, CloudinaryAsset } from '@/app/actions/course';

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
  prerequisites: string[];
  outcomes: string[];
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

export default function CreateCoursePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [courseData, setCourseData] = useState<CourseFormData>({
    title: '',
    subtitle: '',
    description: '',
    category: '',
    level: '',
    thumbnail: null,
    previewVideo: null,
    certificate: false,
    prerequisites: [],
    outcomes: [],
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

  const handlePublish = async () => {
    try {
      setIsSubmitting(true);
      
      // Show loading toast
      const loadingToast = toast.loading('Creating your course...', {
        description: 'Please wait while we set up your course'
      });
      
      const courseId = await createCourse({
        courseData: {
          title: courseData.title,
          subtitle: courseData.subtitle,
          description: courseData.description,
          category: courseData.category,
          level: courseData.level,
          certificate: courseData.certificate,
          prerequisites: courseData.prerequisites,
          outcomes: courseData.outcomes,
          // Pass null for File objects since we're using Cloudinary assets
          thumbnail: null,
          previewVideo: null,
          // Pass the Cloudinary assets
          thumbnailAsset: courseData.thumbnailAsset,
          previewVideoAsset: courseData.previewVideoAsset,
        },
        sections: curriculumData.map((section, index) => ({
          ...section,
          order: index,
        })),
        pricing: pricingData,
      });
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show success message
      toast.success('🎉 Course created successfully!', {
        description: 'Your course has been created and is ready for editing',
        duration: 4000,
      });
      
      router.push(`/tutor/courses/${courseId}`);
    } catch (error: any) {
      console.error('Failed to publish course:', error);
      
      // Determine error type and show appropriate message
      const errorMessage = error.message || 'Failed to create course. Please try again.';
      
      if (errorMessage.includes('title already exists')) {
        toast.error('📝 Duplicate Course Title', {
          description: 'A course with this title already exists. Please choose a different title.',
          duration: 6000,
        });
      } else if (errorMessage.includes('required fields')) {
        toast.error('📋 Missing Information', {
          description: 'Please check that all required fields are filled correctly.',
          duration: 5000,
        });
      } else if (errorMessage.includes('upload') || errorMessage.includes('media')) {
        toast.error('📁 Upload Failed', {
          description: 'Failed to upload course media. Please check your files and try again.',
          duration: 6000,
        });
      } else if (errorMessage.includes('internet') || errorMessage.includes('connection')) {
        toast.error('🌐 Connection Error', {
          description: 'Unable to connect. Please check your internet connection and try again.',
          duration: 6000,
        });
      } else {
        toast.error('❌ Course Creation Failed', {
          description: errorMessage,
          duration: 6000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="container max-w-6xl mx-auto">
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
              ...courseData,
              sections: curriculumData,
              pricing: pricingData,
              // Pass File objects directly 
              thumbnail: courseData.thumbnail,
              previewVideo: courseData.previewVideo,
            }}
            onBack={() => setCurrentStep(2)}
            onPublish={handlePublish}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}