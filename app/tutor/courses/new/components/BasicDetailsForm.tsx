'use client';

import { useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, BookOpen, ArrowRight, Loader2 } from "lucide-react";
import DirectUploader from './DirectUploader';
import { getCategoryOptions } from '@/lib/categories';

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
  previewVideoAsset?: CloudinaryAsset;
  thumbnailAsset?: CloudinaryAsset;
  certificate: boolean;
  prerequisites: string[];
  outcomes: string[];
}

interface BasicDetailsFormProps {
  initialData?: CourseFormData;
  onSave: (data: CourseFormData) => void;
}

export default function BasicDetailsForm({ initialData, onSave }: BasicDetailsFormProps) {
  const [formData, setFormData] = useState<CourseFormData>(initialData || {
    title: '',
    subtitle: '',
    description: '',
    category: '',
    level: '',
    thumbnail: null,
    previewVideo: null,
    certificate: false,
    prerequisites: [''],
    outcomes: [''],
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialData?.thumbnailAsset?.secure_url || null);
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = useMemo(() => {
    const hasTitle = formData.title.trim().length > 0;
    const hasSubtitle = formData.subtitle.trim().length > 0;
    const hasDescription = formData.description.trim().length > 0;
    const hasCategory = formData.category.length > 0;
    const hasLevel = formData.level.length > 0;
    const hasThumbnail = formData.thumbnail !== null || formData.thumbnailAsset !== undefined;
    const hasPreviewVideo = formData.previewVideo !== null || formData.previewVideoAsset !== undefined;
    const hasPrerequisites = (formData.prerequisites || []).some(p => p.trim().length > 0);
    const hasOutcomes = (formData.outcomes || []).some(o => o.trim().length > 0);


    return hasTitle && hasSubtitle && hasDescription && hasCategory && hasLevel && hasThumbnail && hasPreviewVideo && hasPrerequisites && hasOutcomes;
  }, [formData]);

  const addPrerequisite = () => {
    setFormData(prev => ({
      ...prev,
      prerequisites: [...(prev.prerequisites || []), '']
    }));
  };

  const removePrerequisite = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: (prev.prerequisites || []).filter((_, i) => i !== index)
    }));
  };

  const updatePrerequisite = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: (prev.prerequisites || []).map((item, i) => i === index ? value : item)
    }));
  };

  const addOutcome = () => {
    setFormData(prev => ({
      ...prev,
      outcomes: [...(prev.outcomes || []), '']
    }));
  };

  const removeOutcome = (index: number) => {
    setFormData(prev => ({
      ...prev,
      outcomes: (prev.outcomes || []).filter((_, i) => i !== index)
    }));
  };

  const updateOutcome = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      outcomes: (prev.outcomes || []).map((item, i) => i === index ? value : item)
    }));
  };
  const handleInputChange = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleThumbnailUploadSuccess = (result: CloudinaryAsset) => {
    setFormData(prev => ({
      ...prev,
      thumbnailAsset: result,
      thumbnail: null
    }));
    // Set preview from the cloudinary URL
    setThumbnailPreview(result.secure_url);
  };

  const handleVideoUploadSuccess = (result: CloudinaryAsset) => {
    setFormData(prev => ({
      ...prev,
      previewVideoAsset: result,
      previewVideo: null
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSave(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-[#141414] border-gray-800 max-w-4xl mx-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Course Details</h2>
          <p className="text-gray-400">Fill in the basic information about your course</p>
        </div>

        <div className="space-y-8">
          {/* Basic Info */}
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-white">Course Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Complete Web Development Bootcamp"
                className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
              />
            </div>

            <div>
              <Label htmlFor="subtitle" className="text-white">Course Sub-title</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                placeholder="e.g., Master HTML, CSS, JavaScript, React and Node.js"
                className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Course Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what students will learn in your course..."
                className="mt-2 h-32 bg-[#0a0a0a] border-gray-800 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="category" className="text-white">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger className="mt-2 bg-[#0a0a0a] border-gray-800 text-white">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-800 max-h-60">
                    {getCategoryOptions().map((category) => (
                      <SelectItem key={category.value} value={category.value} className="text-white">
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="level" className="text-white">Difficulty Level</Label>
                <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                  <SelectTrigger className="mt-2 bg-[#0a0a0a] border-gray-800 text-white">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-800">
                    <SelectItem value="beginner" className="text-white">Beginner</SelectItem>
                    <SelectItem value="intermediate" className="text-white">Intermediate</SelectItem>
                    <SelectItem value="advanced" className="text-white">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Prerequisites */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Prerequisites</h3>
          <p className="text-gray-400">What students should know before taking this course</p>
          
          <div className="space-y-3">
            {(formData.prerequisites || []).map((prerequisite, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={prerequisite}
                  onChange={(e) => updatePrerequisite(index, e.target.value)}
                  placeholder="e.g., Basic knowledge of HTML and CSS"
                  className="flex-1 bg-[#0a0a0a] border-gray-800 text-white"
                />
                {(formData.prerequisites || []).length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePrerequisite(index)}
                    className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addPrerequisite}
              className="border-gray-600 text-gray-400 hover:border-gray-500"
            >
              + Add Prerequisite
            </Button>
          </div>
        </div>

        {/* Learning Outcomes */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Learning Outcomes</h3>
          <p className="text-gray-400">What students will learn from this course</p>
          
          <div className="space-y-3">
            {(formData.outcomes || []).map((outcome, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={outcome}
                  onChange={(e) => updateOutcome(index, e.target.value)}
                  placeholder="e.g., Build responsive websites using modern CSS"
                  className="flex-1 bg-[#0a0a0a] border-gray-800 text-white"
                />
                {(formData.outcomes || []).length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOutcome(index)}
                    className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addOutcome}
              className="border-gray-600 text-gray-400 hover:border-gray-500"
            >
              + Add Learning Outcome
            </Button>
          </div>
        </div>
          {/* Media Upload */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Course Media</h3>
            
            <div className="space-y-4">
              {/* Thumbnail Upload */}
              <div className="border-2 border-dashed border-gray-800 rounded-lg p-8">
                <div className="flex flex-col items-center">
                  {thumbnailPreview ? (
                    <div className="relative w-full max-w-md mb-4">
                      <img
                        src={thumbnailPreview}
                        alt="Course thumbnail preview"
                        className="w-full rounded-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 border-0 text-white"
                        onClick={() => {
                          setThumbnailPreview(null);
                          setFormData(prev => ({
                            ...prev,
                            thumbnail: null,
                            thumbnailAsset: undefined
                          }));
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <DirectUploader
                      resourceType="image"
                      buttonText="Upload Course Thumbnail"
                      maxFileSize={5}
                      onUploadSuccess={handleThumbnailUploadSuccess}
                    />
                  )}
                </div>
              </div>

              {/* Preview Video Upload */}
              <div className="border-2 border-dashed border-gray-800 rounded-lg p-8">
                <div className="flex flex-col items-center">
                {formData.previewVideoAsset?.secure_url ? (
                  <div className="relative w-full max-w-md mb-4">
                    <video
                      src={formData.previewVideoAsset.secure_url}
                      controls
                      className="w-full rounded-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 border-0 text-white"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          previewVideo: null,
                          previewVideoAsset: undefined
                        }));
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <DirectUploader
                    resourceType="video"
                    buttonText="Upload Preview Video"
                    maxFileSize={50}
                    onUploadSuccess={handleVideoUploadSuccess}
                  />
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Course Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Certificate on Completion</Label>
                  <p className="text-sm text-gray-400">
                    Students will receive a certificate after completing the course
                  </p>
                </div>
                <Switch
                  checked={formData.certificate}
                  onCheckedChange={(checked) => handleInputChange('certificate', checked)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
        <Button
            onClick={handleSubmit}
            disabled={isLoading || !isFormValid}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}