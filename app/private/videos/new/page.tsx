'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createVideo, VideoFormData } from '@/app/actions/video';
import VideoUploadForm from './components/VideoUploadForm';

export default function CreateVideoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateVideo = async (videoData: VideoFormData) => {
    try {
      setIsSubmitting(true);
      
      const videoId = await createVideo(videoData);
      
      toast.success('Video uploaded successfully!');
      router.push(`/private/videos/${videoId}`);
    } catch (error: unknown) {
      console.error('Failed to create video:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload video. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upload New Video</h1>
          <p className="text-gray-400">Share your knowledge with the community</p>
        </div>

        <VideoUploadForm 
          onSubmit={handleCreateVideo}
          isSubmitting={isSubmitting}
          submitButtonText="Upload Video"
        />
      </div>
    </div>
  );
}