'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2, User } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface Comment {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    image?: string;
  };
  review: string;
  createdAt: string;
}

interface CommentsSectionProps {
  videoId: string;
  initialComments: Comment[];
  totalComments: number;
  isLoggedIn: boolean;
}

export default function CommentsSection({ 
  videoId, 
  initialComments, 
  totalComments, 
  isLoggedIn 
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please write a comment before submitting');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          review: newComment.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add comment');
      }

      // Add the new comment to the top of the list
      setComments(prev => [data.comment, ...prev]);
      setNewComment('');
      toast.success('Comment added successfully!');

    } catch (error: unknown) {
      console.error('Comment submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add comment. Please try again.';
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

  return (
    <Card className="bg-[#141414] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoggedIn ? (
          <div className="mb-6">
            <textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white placeholder-gray-400 resize-none focus:border-blue-500 focus:outline-none"
              rows={3}
            />
            <Button 
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Comment'
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-6 mb-6 border-b border-gray-800">
            <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Sign in to comment</p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Sign In
            </Button>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment._id} className="flex gap-3 p-4 bg-[#0a0a0a] rounded-lg">
                <div className="flex-shrink-0">
                  {comment.userId.image ? (
                    <Image
                      src={comment.userId.image}
                      alt={`${comment.userId.firstName} ${comment.userId.lastName}`}
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">
                      {comment.userId.firstName} {comment.userId.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">{comment.review}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}