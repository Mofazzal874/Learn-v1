'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2, User, Star } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface Review {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    image?: string;
  };
  rating: number;
  review: string;
  createdAt: string;
}

interface CourseReviewsProps {
  courseId: string;
  initialReviews: Review[];
  totalReviews: number;
  isLoggedIn: boolean;
}

export default function CourseReviews({ 
  courseId, 
  initialReviews, 
  totalReviews, 
  isLoggedIn 
}: CourseReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitReview = async () => {
    if (!newReview.trim()) {
      toast.error('Please write a review before submitting');
      return;
    }

    if (newRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/courses/${courseId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: newRating,
          review: newReview.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add review');
      }

      // Add the new review to the top of the list
      setReviews(prev => [data.review, ...prev.slice(0, 9)]); // Keep only top 10
      setNewReview('');
      setNewRating(0);
      toast.success('Review submitted successfully!');

    } catch (error: unknown) {
      console.error('Review submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add review. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-400'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-[#141414] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Reviews ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoggedIn ? (
          <div className="mb-6 p-4 bg-[#0a0a0a] rounded-lg">
            <h3 className="text-white font-medium mb-4">Write a Review</h3>
            
            {/* Rating Input */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Your Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    disabled={isSubmitting}
                    className="transition-colors duration-200 cursor-pointer hover:scale-110"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors duration-200 ${
                        star <= (hoveredRating || newRating)
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-gray-400 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Text */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Your Review</label>
              <textarea
                placeholder="Share your experience with this course..."
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                className="w-full bg-[#141414] border border-gray-800 rounded-lg p-3 text-white placeholder-gray-400 resize-none focus:border-blue-500 focus:outline-none"
                rows={4}
              />
            </div>

            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubmitReview}
              disabled={isSubmitting || !newReview.trim() || newRating === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Review'
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-6 mb-6 border-b border-gray-800">
            <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Sign in to write a review</p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Sign In
            </Button>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review._id} className="flex gap-3 p-4 bg-[#0a0a0a] rounded-lg">
                <div className="flex-shrink-0">
                  {review.userId.image ? (
                    <Image
                      src={review.userId.image}
                      alt={`${review.userId.firstName} ${review.userId.lastName}`}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-white">
                      {review.userId.firstName} {review.userId.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <div className="mb-2">
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-gray-300 text-sm">{review.review}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              No reviews yet. Be the first to review this course!
            </div>
          )}
        </div>

        {reviews.length > 0 && reviews.length < totalReviews && (
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              Showing {reviews.length} of {totalReviews} reviews
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}