'use client';

import { useEffect } from 'react';

interface VideoProgressTrackerProps {
  videoId: string;
  videoTitle: string;
  videoDuration: string;
  videoOutcomes: string[];
  isLoggedIn: boolean;
}

export default function VideoProgressTracker({ 
  videoId, 
  videoTitle, 
  videoDuration, 
  videoOutcomes, 
  isLoggedIn 
}: VideoProgressTrackerProps) {
  
  useEffect(() => {
    if (!isLoggedIn) return;

    const trackVideoProgress = async () => {
      try {
        // Parse duration to minutes (assuming format like "10:30" or "1:05:30")
        const parseDuration = (duration: string): number => {
          const parts = duration.split(':').map(Number);
          if (parts.length === 2) {
            // MM:SS format
            return parts[0] + (parts[1] / 60);
          } else if (parts.length === 3) {
            // HH:MM:SS format
            return (parts[0] * 60) + parts[1] + (parts[2] / 60);
          }
          return 0;
        };

        const durationInMinutes = parseDuration(videoDuration || '0');

        const response = await fetch('/api/videos/track-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoId,
            title: videoTitle,
            duration: durationInMinutes,
            outcomes: videoOutcomes
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to track video progress:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            requestBody: {
              videoId,
              title: videoTitle,
              duration: durationInMinutes,
              outcomes: videoOutcomes
            }
          });
        } else {
          console.log('Video progress tracked successfully');
        }

      } catch (error) {
        console.error('Error tracking video progress:', error);
      }
    };

    // Track progress when component mounts (user opens video page)
    trackVideoProgress();

    // Also increment view count
    const incrementViews = async () => {
      try {
        await fetch(`/api/videos/${videoId}/views`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error incrementing views:', error);
      }
    };

    incrementViews();

  }, [videoId, videoTitle, videoDuration, videoOutcomes, isLoggedIn]);

  // This component doesn't render anything, it's just for tracking
  return null;
}