'use client';

import { useState } from 'react';
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
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (field: 'thumbnail' | 'previewVideo', file: File | null) => {
    if (file && field === 'thumbnail') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    handleInputChange(field, file);
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
                  <DirectUploader
                    resourceType="video"
                    buttonText="Upload Preview Video"
                    maxFileSize={50}
                    onUploadSuccess={handleVideoUploadSuccess}
                  />
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
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
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