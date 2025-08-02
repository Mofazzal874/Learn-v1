'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, Video, Plus, X } from "lucide-react";
import Image from "next/image";
import DirectUploader from '@/app/tutor/courses/new/components/DirectUploader';
import { VideoFormData } from '@/app/actions/video';
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

interface VideoUploadFormProps {
  initialData?: Partial<VideoFormData>;
  onSubmit: (data: VideoFormData) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export default function VideoUploadForm({ 
  initialData, 
  onSubmit, 
  isSubmitting, 
  submitButtonText = "Upload Video" 
}: VideoUploadFormProps) {
  const [formData, setFormData] = useState<VideoFormData>({
    title: initialData?.title || '',
    subtitle: initialData?.subtitle || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    subcategory: initialData?.subcategory || '',
    level: initialData?.level || '',
    prerequisites: initialData?.prerequisites || [],
    outcomes: initialData?.outcomes || [],
    tags: initialData?.tags || [],
    language: initialData?.language || 'English',
    thumbnail: null,
    video: null,
    thumbnailAsset: initialData?.thumbnailAsset,
    videoAsset: initialData?.videoAsset,
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData?.thumbnailAsset?.secure_url || null
  );
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newOutcome, setNewOutcome] = useState('');
  const [newTag, setNewTag] = useState('');

  const handleInputChange = (field: keyof VideoFormData, value: string | string[]) => {
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
    setThumbnailPreview(result.secure_url);
  };

  const handleVideoUploadSuccess = (result: CloudinaryAsset) => {
    setFormData(prev => ({
      ...prev,
      videoAsset: result,
      video: null
    }));
    setVideoFileName(`Video uploaded (${(result.bytes / (1024 * 1024)).toFixed(1)} MB)`);
  };

  const addPrerequisite = () => {
    if (newPrerequisite.trim()) {
      setFormData(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, newPrerequisite.trim()]
      }));
      setNewPrerequisite('');
    }
  };

  const removePrerequisite = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== index)
    }));
  };

  const addOutcome = () => {
    if (newOutcome.trim()) {
      setFormData(prev => ({
        ...prev,
        outcomes: [...prev.outcomes, newOutcome.trim()]
      }));
      setNewOutcome('');
    }
  };

  const removeOutcome = (index: number) => {
    setFormData(prev => ({
      ...prev,
      outcomes: prev.outcomes.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    
    // Check if description has actual content (not just HTML tags)
    const textContent = formData.description.replace(/<[^>]*>/g, '').trim();
    if (!textContent) {
      alert('Description is required');
      return;
    }

    if (!formData.category) {
      alert('Category is required');
      return;
    }

    if (!formData.level) {
      alert('Level is required');
      return;
    }

    if (!formData.videoAsset && !formData.video) {
      alert('Video is required');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <Card className="bg-[#141414] border-gray-800">
      <div className="p-6">
        <div className="space-y-8">
          {/* Basic Info */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Video Details</h2>
            
            <div>
              <Label htmlFor="title" className="text-white">Video Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Learn React in 30 Minutes"
                className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
              />
            </div>

            <div>
              <Label htmlFor="subtitle" className="text-white">Subtitle</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                placeholder="e.g., A comprehensive introduction to React framework"
                className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
              />
            </div>

            <div>
              <RichTextEditor
                label="Description"
                required
                value={formData.description}
                onChange={(value) => handleInputChange('description', value)}
                placeholder="Describe what viewers will learn from this video..."
                height="150px"
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="category" className="text-white">Category *</Label>
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
                <Label htmlFor="subcategory" className="text-white">Subcategory</Label>
                <Input
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) => handleInputChange('subcategory', e.target.value)}
                  placeholder="e.g., Frontend Development"
                  className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="level" className="text-white">Difficulty Level *</Label>
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

              <div>
                <Label htmlFor="language" className="text-white">Language</Label>
                <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                  <SelectTrigger className="mt-2 bg-[#0a0a0a] border-gray-800 text-white">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-800">
                    <SelectItem value="English" className="text-white">English</SelectItem>
                    <SelectItem value="Spanish" className="text-white">Spanish</SelectItem>
                    <SelectItem value="French" className="text-white">French</SelectItem>
                    <SelectItem value="German" className="text-white">German</SelectItem>
                    <SelectItem value="Chinese" className="text-white">Chinese</SelectItem>
                    <SelectItem value="Japanese" className="text-white">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Media Files</h3>
            
            {/* Video Upload */}
            <div className="border-2 border-dashed border-gray-800 rounded-lg p-8">
              <div className="flex flex-col items-center">
                <h4 className="text-white mb-4">Video File *</h4>
                {videoFileName ? (
                  <div className="flex items-center gap-2 mb-4">
                    <Video className="h-6 w-6 text-blue-400" />
                    <span className="text-gray-400">{videoFileName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                      onClick={() => {
                        setVideoFileName(null);
                        setFormData(prev => ({
                          ...prev,
                          video: null,
                          videoAsset: undefined
                        }));
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <DirectUploader
                    resourceType="video"
                    buttonText="Upload Video"
                    maxFileSize={100}
                    folder="videos"
                    onUploadSuccess={handleVideoUploadSuccess}
                  />
                )}
              </div>
            </div>

            {/* Thumbnail Upload */}
            <div className="border-2 border-dashed border-gray-800 rounded-lg p-8">
              <div className="flex flex-col items-center">
                <h4 className="text-white mb-4">Thumbnail (Optional)</h4>
                {thumbnailPreview ? (
                  <div className="relative w-full max-w-md mb-4">
                    <Image
                      src={thumbnailPreview}
                      alt="Video thumbnail preview"
                      width={500}
                      height={300}
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
                    buttonText="Upload Thumbnail"
                    maxFileSize={5}
                    folder="videos/thumbnails"
                    onUploadSuccess={handleThumbnailUploadSuccess}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Prerequisites */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Prerequisites</h3>
            <div className="flex gap-2">
              <Input
                value={newPrerequisite}
                onChange={(e) => setNewPrerequisite(e.target.value)}
                placeholder="Add a prerequisite"
                className="bg-[#0a0a0a] border-gray-800 text-white"
                onKeyPress={(e) => e.key === 'Enter' && addPrerequisite()}
              />
              <Button
                type="button"
                onClick={addPrerequisite}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.prerequisites.map((prerequisite, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-800 rounded-full px-3 py-1">
                  <span className="text-white text-sm">{prerequisite}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePrerequisite(index)}
                    className="p-0 h-auto text-gray-400 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Outcomes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Learning Outcomes</h3>
            <div className="flex gap-2">
              <Input
                value={newOutcome}
                onChange={(e) => setNewOutcome(e.target.value)}
                placeholder="Add a learning outcome"
                className="bg-[#0a0a0a] border-gray-800 text-white"
                onKeyPress={(e) => e.key === 'Enter' && addOutcome()}
              />
              <Button
                type="button"
                onClick={addOutcome}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.outcomes.map((outcome, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-800 rounded-full px-3 py-1">
                  <span className="text-white text-sm">{outcome}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOutcome(index)}
                    className="p-0 h-auto text-gray-400 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Tags</h3>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                className="bg-[#0a0a0a] border-gray-800 text-white"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button
                type="button"
                onClick={addTag}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-800 rounded-full px-3 py-1">
                  <span className="text-white text-sm">{tag}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTag(index)}
                    className="p-0 h-auto text-gray-400 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {submitButtonText}
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}