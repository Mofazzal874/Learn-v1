'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from "@/auth";
import CurriculumForm from './components/CurriculumForm';
import PricingForm from './components/PricingForm';
import PreviewForm from './components/PreviewForm';
import BasicDetailsForm from './components/BasicDetailsForm';
import { toast } from 'sonner';

interface CourseFormData {
  title: string;
  description: string;
  category: string;
  level: string;
  thumbnail: File | null;
  previewVideo: File | null;
  certificate: boolean;
  forum: boolean;
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
  type: 'video' | 'article' | 'resource';
  duration: string;
  content: string;
}

interface PricingData {
  basePrice: string;
  hasDiscount: boolean;
  discountPrice: string;
  discountEnds: string;
  installmentEnabled: boolean;
  installmentCount: string;
  installmentPrice: string;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [courseData, setCourseData] = useState<CourseFormData>({
    title: '',
    description: '',
    category: '',
    level: '',
    thumbnail: null,
    previewVideo: null,
    certificate: false,
    forum: true,
  });
  const [curriculumData, setCurriculumData] = useState<Section[]>([]);
  const [pricingData, setPricingData] = useState<PricingData>({
    basePrice: '',
    hasDiscount: false,
    discountPrice: '',
    discountEnds: '',
    installmentEnabled: false,
    installmentCount: '3',
    installmentPrice: '',
  });

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
      // TODO: Implement course publishing logic
      // 1. Upload media files
      // 2. Create course in database
      // 3. Create sections and lessons
      // 4. Set pricing
      // 5. Publish course
      
      toast.success('Course published successfully!');
      router.push('/tutor/courses');
    } catch (error) {
      console.error('Failed to publish course:', error);
      toast.error('Failed to publish course. Please try again.');
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
              // Convert File objects to URLs for preview
              thumbnail: courseData.thumbnail ? URL.createObjectURL(courseData.thumbnail) : null,
              previewVideo: courseData.previewVideo ? URL.createObjectURL(courseData.previewVideo) : null,
            }}
            onBack={() => setCurrentStep(2)}
            onPublish={handlePublish}
          />
        )}
      </div>
    </div>
  );
}