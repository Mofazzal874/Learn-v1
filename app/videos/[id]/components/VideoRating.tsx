'use client';

import { useState, useEffect } from 'react';
import { Star } from "lucide-react";
import { toast } from "sonner";

interface VideoRatingProps {
  videoId: string;
  isLoggedIn: boolean;
}

export default function VideoRating({ videoId, isLoggedIn }: VideoRatingProps) {
  const [userRating, setUserRating] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current rating data
  useEffect(() => {
    const fetchRatingData = async () => {
      try {
        const response = await fetch(`/api/videos/${videoId}/rating`);
        if (response.ok) {
          const data = await response.json();
          console.log('Rating data received:', data);
          setAverageRating(data.averageRating || 0);
          setTotalRatings(data.totalRatings || 0);
          setUserRating(data.userRating || 0);
        }
      } catch (error) {
        console.error('Error fetching rating data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRatingData();
  }, [videoId]);

  const handleRatingSubmit = async (rating: number) => {
    if (!isLoggedIn) {
      toast.error('Please sign in to rate this video');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/videos/${videoId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rating');
      }

      console.log('Rating submission response:', data);
      setUserRating(rating);
      setAverageRating(data.averageRating);
      setTotalRatings(data.totalRatings);
      
      toast.success('Rating submitted successfully!');

    } catch (error: unknown) {
      console.error('Rating submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit rating. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className="h-5 w-5 text-gray-600 animate-pulse"
            />
          ))}
        </div>
        <span className="text-gray-400 text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Star Rating Input */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= (hoveredRating || userRating);
          return (
            <button
              key={star}
              onClick={() => handleRatingSubmit(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              disabled={isSubmitting || !isLoggedIn}
              className={`transition-colors duration-200 ${
                !isLoggedIn ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'
              }`}
            >
              <Star
                className={`h-5 w-5 transition-colors duration-200 ${
                  isFilled 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-gray-400 hover:text-yellow-300'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Rating Display */}
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <span className="font-medium">
          {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'}
        </span>
        {totalRatings > 0 && (
          <span className="text-gray-500">
            ({totalRatings} rating{totalRatings !== 1 ? 's' : ''})
          </span>
        )}
      </div>

      {/* User feedback */}
      {userRating > 0 && (
        <span className="text-xs text-blue-400">
          You rated: {userRating} star{userRating !== 1 ? 's' : ''}
        </span>
      )}

      {!isLoggedIn && (
        <span className="text-xs text-gray-500">
          Sign in to rate
        </span>
      )}
    </div>
  );
}