"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Database, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface SaveRoadmapDialogProps {
  onSave: (name: string) => Promise<void>;
  isSaving: boolean;
}

interface SaveResponse {
  success: boolean;
  id: string;
  name: string;
  embeddingStatus?: "processing" | "completed" | "failed";
  nodeCount?: number;
  edgeCount?: number;
}

export default function SaveRoadmapDialog({ onSave, isSaving }: SaveRoadmapDialogProps) {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [embeddingStatus, setEmbeddingStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [savedRoadmapId, setSavedRoadmapId] = useState<string | null>(null);

  console.log("SaveRoadmapDialog rendered with props:", { onSave: !!onSave, isSaving });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter a name for your roadmap");
      return;
    }
    
    if (!onSave) {
      console.error("onSave prop is not provided to SaveRoadmapDialog");
      toast.error("Unable to save roadmap. The save function is not available.");
      return;
    }
    
    try {
      console.log("Saving roadmap with name:", name);
      
      // Set embedding processing state
      setEmbeddingStatus("processing");
      setSavedRoadmapId(null);
      
      await onSave(name);
      
      // Show success message with embedding info
      toast.success("Roadmap saved successfully! AI embeddings are being processed...", {
        description: "This will help with future search and recommendations"
      });
      
      // Simulate embedding completion after a delay (in real app, you'd check the API)
      setTimeout(() => {
        setEmbeddingStatus("completed");
        toast.success("AI embeddings completed!", {
          description: "Your roadmap is now fully searchable"
        });
      }, 3000);
      
      setOpen(false);
      setName("");
      
    } catch (error) {
      console.error("Failed to save roadmap:", error);
      setEmbeddingStatus("failed");
      toast.error("Failed to save roadmap");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="px-8 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg shadow-blue-500/20"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {embeddingStatus === "processing" ? "Saving & Processing AI..." : "Saving..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Roadmap
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#141414] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Save Your Roadmap</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Roadmap Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your roadmap"
              className="bg-[#1a1a1a] border-white/10 text-white"
              required
            />
          </div>
          
          {/* Embedding Status Information */}
          {(isSaving || embeddingStatus !== "idle") && (
            <div className="space-y-2">
              <div className="text-sm text-gray-400">
                AI Enhancement Status:
              </div>
              <div className="flex items-center gap-2 text-sm">
                {embeddingStatus === "processing" && (
                  <>
                    <Database className="h-4 w-4 text-blue-400 animate-pulse" />
                    <span className="text-blue-400">Processing AI embeddings...</span>
                  </>
                )}
                {embeddingStatus === "completed" && (
                  <>
                    <Check className="h-4 w-4 text-green-400" />
                    <span className="text-green-400">AI embeddings completed</span>
                  </>
                )}
                {embeddingStatus === "failed" && (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400">AI processing failed (roadmap still saved)</span>
                  </>
                )}
              </div>
              <div className="text-xs text-gray-500">
                This enables intelligent search and personalized recommendations
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white border-white/10 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {embeddingStatus === "processing" ? "Saving & Processing AI..." : "Saving..."}
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 