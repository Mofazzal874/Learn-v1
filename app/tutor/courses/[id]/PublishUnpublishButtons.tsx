'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface PublishUnpublishButtonsProps {
  courseId: string;
  published: boolean;
}

export default function PublishUnpublishButtons({ courseId, published }: PublishUnpublishButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(published);
  const router = useRouter();

  const handlePublish = async () => {
    setIsLoading(true);
    try {
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

      setIsPublished(true);
      toast.success('Course published successfully!');
      router.refresh(); // Refresh the page to update any server-side data
    } catch (error: unknown) {
      console.error('Publish error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish course. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpublish = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/unpublish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unpublish course');
      }

      setIsPublished(false);
      toast.success('Course unpublished successfully!');
      router.refresh(); // Refresh the page to update any server-side data
    } catch (error: unknown) {
      console.error('Unpublish error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to unpublish course. Please try again.';
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
          className="w-full bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Unpublishing...
            </>
          ) : (
            <>
              <BookOpen className="h-4 w-4 mr-2" />
              Unpublish Course
            </>
          )}
        </Button>
      ) : (
        <Button 
          onClick={handlePublish} 
          disabled={isLoading}
          className="w-full bg-green-500/10 text-green-400 hover:bg-green-500/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <BookOpen className="h-4 w-4 mr-2" />
              Publish Course
            </>
          )}
        </Button>
      )}
    </>
  );
}