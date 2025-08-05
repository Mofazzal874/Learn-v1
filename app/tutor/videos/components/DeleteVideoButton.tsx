'use client';

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteVideoButtonProps {
  videoId: string;
  videoTitle: string;
  className?: string;
  variant?: "dropdown" | "button";
}

export default function DeleteVideoButton({ 
  videoId, 
  videoTitle, 
  className,
  variant = "dropdown" 
}: DeleteVideoButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleDeleteClick = () => {
    setShowDialog(true);
  };

  const handleConfirmDelete = async () => {
    setShowDialog(false);
    setIsDeleting(true);
    
    try {
      console.log(`[DELETE_VIDEO_CLIENT] Starting deletion of video ${videoId}`);
      
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete video');
      }

      console.log(`[DELETE_VIDEO_CLIENT] Video ${videoId} deleted successfully`);
      toast.success(`Video "${videoTitle}" deleted successfully!`);
      
      // Check if we're on the individual video page or videos list
      const isOnVideoPage = pathname.includes(`/tutor/videos/${videoId}`);
      
      if (isOnVideoPage) {
        // Redirect to videos list since this video page no longer exists
        console.log(`[DELETE_VIDEO_CLIENT] Redirecting to videos list from individual video page`);
        router.push('/tutor/videos');
      } else {
        // Just refresh the videos list page to show updated videos
        console.log(`[DELETE_VIDEO_CLIENT] Refreshing videos list page`);
        router.refresh();
      }
      
    } catch (error: unknown) {
      console.error('[DELETE_VIDEO_CLIENT] Delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete video. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDialog(false);
  };

  const renderButton = () => {
    if (variant === "dropdown") {
      return (
        <DropdownMenuItem 
          className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-900/20"
          onSelect={(e) => {
            e.preventDefault();
            handleDeleteClick();
          }}
          disabled={isDeleting}
        >
          <div className="flex w-full items-center">
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </div>
        </DropdownMenuItem>
      );
    }

    return (
      <Button 
        onClick={handleDeleteClick}
        disabled={isDeleting}
        className={`bg-red-500/10 text-red-400 hover:bg-red-500/20 ${className}`}
      >
        {isDeleting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Video
          </>
        )}
      </Button>
    );
  };

  return (
    <>
      {renderButton()}
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#141414] border-red-900/50">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Delete Video
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Are you sure you want to delete <span className="font-semibold text-white">"{videoTitle}"</span>?
              <br />
              <span className="text-red-400 font-medium">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancelDelete}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}