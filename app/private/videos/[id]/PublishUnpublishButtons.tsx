'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PublishUnpublishButtonsProps {
  videoId: string;
  published: boolean;
}

export default function PublishUnpublishButtons({ videoId, published }: PublishUnpublishButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(published);
  const router = useRouter();

  const handlePublish = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish video');
      }

      setIsPublished(true);
      toast.success('Video published successfully!');
      router.refresh(); // Refresh the page to update any server-side data
    } catch (error: unknown) {
      console.error('Publish error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish video. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpublish = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/unpublish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unpublish video');
      }

      setIsPublished(false);
      toast.success('Video unpublished successfully!');
      router.refresh(); // Refresh the page to update any server-side data
    } catch (error: unknown) {
      console.error('Unpublish error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to unpublish video. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isPublished ? (
        <Button 
          onClick={handleUnpublish}
          disabled={isLoading}
          variant="outline" 
          className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Unpublishing...' : 'Unpublish'}
        </Button>
      ) : (
        <Button 
          onClick={handlePublish}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Publishing...' : 'Publish'}
        </Button>
      )}
    </>
  );
}