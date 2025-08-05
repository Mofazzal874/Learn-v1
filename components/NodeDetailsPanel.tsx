// components/NodeDetailsPanel.tsx
"use client";

import React, { useState } from "react";
import { RoadmapNode } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


import { X, ChevronDown, ChevronRight, BookOpen, Video } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface NodeDetailsPanelProps {
  node: RoadmapNode;
  onClose: () => void;
  onUpdate: (node: RoadmapNode) => void;
  isMobile?: boolean;
}

const ensureStringTitle = (title: string | React.ReactNode): string => {
  if (typeof title === 'string') {
    return title;
  }
  if (typeof title === 'number') {
    return String(title);
  }
  // For any other type (React elements, objects, etc.), convert to string
  return String(title || '');
};



const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  node,
  onClose,
  onUpdate,
  isMobile = false,
}) => {
  const fixedNode = {...node, title: ensureStringTitle(node.title)};
  const [showSuggestedCourses, setShowSuggestedCourses] = useState(false);
  const [showSuggestedVideos, setShowSuggestedVideos] = useState(false);
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    onUpdate({
      ...fixedNode,
      [name]: value,
    });
  };

  const handleCompletedChange = (checked: boolean) => {
    onUpdate({
      ...fixedNode,
      completed: checked,
      completionTime: checked ? new Date().toISOString() : undefined,
    });
  };

  return (
    <div className={cn(
      "flex flex-col h-full",
      !isMobile && "w-96"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Node Details</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-white">Title</Label>
          <Input
            id="title"
            name="title"
            value={fixedNode.title}
            onChange={handleInputChange}
            className="bg-[#1a1a1a] border-white/10 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-white">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={Array.isArray(fixedNode.description) 
              ? fixedNode.description.join('\n') 
              : fixedNode.description || ''}
            onChange={(e) => {
              const newDescription = e.target.value.split('\n').filter(line => line.trim());
              onUpdate({
                ...fixedNode,
                description: newDescription
              });
            }}
            className="min-h-[100px] bg-[#1a1a1a] border-white/10 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeNeeded" className="text-white">Time Needed (hours)</Label>
          <Input
            id="timeNeeded"
            name="timeNeeded"
            type="number"
            value={fixedNode.timeNeeded || ""}
            onChange={handleInputChange}
            className="bg-[#1a1a1a] border-white/10 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeConsumed" className="text-white">Time Consumed (hours)</Label>
          <Input
            id="timeConsumed"
            name="timeConsumed"
            type="number"
            value={fixedNode.timeConsumed || ""}
            onChange={handleInputChange}
            className="bg-[#1a1a1a] border-white/10 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadline" className="text-white">Deadline</Label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            value={fixedNode.deadline || ""}
            onChange={handleInputChange}
            className="bg-[#1a1a1a] border-white/10 text-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="completed"
            checked={fixedNode.completed || false}
            onCheckedChange={handleCompletedChange}
          />
          <Label htmlFor="completed" className="text-white">Completed</Label>
        </div>

        {fixedNode.completed && fixedNode.completionTime && (
          <div className="text-sm text-gray-400">
            Completed on: {new Date(fixedNode.completionTime).toLocaleDateString()}
          </div>
        )}

        {/* Suggested Courses Section */}
        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={() => setShowSuggestedCourses(!showSuggestedCourses)}
            className="w-full flex items-center justify-between bg-[#1a1a1a] border-white/10 text-white hover:bg-[#2a2a2a]"
          >
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Suggested Courses</span>
            </div>
            {showSuggestedCourses ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          
          {showSuggestedCourses && (
            <div className="p-3 bg-[#1a1a1a] rounded-md border border-white/10">
              {/* Mock data - will be replaced with actual courses later */}
              <div className="space-y-2">
                <p className="text-sm text-gray-400 text-center">No courses found</p>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Videos Section */}
        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={() => setShowSuggestedVideos(!showSuggestedVideos)}
            className="w-full flex items-center justify-between bg-[#1a1a1a] border-white/10 text-white hover:bg-[#2a2a2a]"
          >
            <div className="flex items-center space-x-2">
              <Video className="h-4 w-4" />
              <span>Suggested Videos</span>
            </div>
            {showSuggestedVideos ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          
          {showSuggestedVideos && (
            <div className="p-3 bg-[#1a1a1a] rounded-md border border-white/10">
              {/* Mock data - will be replaced with actual videos later */}
              <div className="space-y-2">
                <p className="text-sm text-gray-400 text-center">No videos found</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeDetailsPanel;
