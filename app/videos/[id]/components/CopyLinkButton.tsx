'use client';

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

export default function CopyLinkButton() {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  return (
    <Button 
      variant="outline" 
      className="border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800"
      onClick={handleCopyLink}
    >
      <Share2 className="h-4 w-4 mr-2" />
      Copy Link
    </Button>
  );
}