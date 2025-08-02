'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateVideo, VideoFormData } from '@/app/actions/video';
import VideoUploadForm from '../../new/components/VideoUploadForm';

interface Video {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  subcategory: string;
  level: string;
  prerequisites: string[];
  outcomes: string[];
  tags: string[];
  language: string;
  thumbnail: string;
  thumbnailAsset: {
    secure_url: string;
    public_id: string;
    resource_type: string;
    format: string;
    duration?: number;
    bytes: number;
    width?: number;
    height?: number;
  };
  videoLink: string;
  videoAsset: {
    secure_url: string;
    public_id: string;
    resource_type: string;
    format: string;
    duration?: number;
    bytes: number;
    width?: number;
    height?: number;
  };
}

export default function EditVideoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchVideo() {
      try {
        const response = await fetch(`/api/videos/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch video');
        }
        const videoData = await response.json();
        setVideo(videoData);
      } catch (error) {
        console.error('Error fetching video:', error);
        toast.error('Failed to load video data');
        router.push('/private/videos');
      } finally {
        setIsLoading(false);
      }
    }

    fetchVideo();
  }, [params.id, router]);

  const handleUpdateVideo = async (videoData: VideoFormData) => {
    try {
      setIsSubmitting(true);
      
      await updateVideo(params.id, videoData);
      
      toast.success('Video updated successfully!');
      router.push(`/private/videos/${params.id}`);
    } catch (error: unknown) {
      console.error('Failed to update video:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update video. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Video Not Found</h1>
          <p className="text-gray-400">The video you&apos;re trying to edit doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const initialData: Partial<VideoFormData> = {
    title: video.title,
    subtitle: video.subtitle,
    description: video.description,
    category: video.category,
    subcategory: video.subcategory,
    level: video.level,
    prerequisites: video.prerequisites || [],
    outcomes: video.outcomes || [],
    tags: video.tags || [],
    language: video.language,
    thumbnailAsset: video.thumbnailAsset,
    videoAsset: video.videoAsset,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Edit Video</h1>
          <p className="text-gray-400">Update your video information and content</p>
        </div>

        <VideoUploadForm 
          initialData={initialData}
          onSubmit={handleUpdateVideo}
          isSubmitting={isSubmitting}
          submitButtonText="Update Video"
        />
      </div>
    </div>
  );
}