"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface SaveRoadmapDialogProps {
  onSave: (name: string) => Promise<void>;
  isSaving: boolean;
}

export default function SaveRoadmapDialog({ onSave, isSaving }: SaveRoadmapDialogProps) {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

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
      await onSave(name);
      setOpen(false);
      setName("");
      toast.success("Roadmap saved successfully!");
    } catch (error) {
      console.error("Failed to save roadmap:", error);
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
              Saving...
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
                  Saving...
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