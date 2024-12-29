// components/NodeDetailsPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import { RoadmapNode } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { format } from "date-fns";
import { Info } from "lucide-react";

interface NodeDetailsPanelProps {
  node: RoadmapNode;
  onClose: () => void;
  onUpdate: (node: RoadmapNode) => void;
  isMobile?: boolean;
}

const NodeContent: React.FC<NodeDetailsPanelProps> = ({
  node,
  onClose,
  onUpdate,
}) => {
  const [editableNode, setEditableNode] = useState<RoadmapNode>(node);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditableNode(node);
  }, [node]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditableNode((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    onUpdate(editableNode);
    setIsEditing(false);
  };

  const calculateProgress = () => {
    if (!editableNode.timeNeeded) return 0;
    return Math.min(
      100,
      Math.round((editableNode.timeConsumed || 0) / editableNode.timeNeeded * 100)
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                name="title"
                value={editableNode.title}
                onChange={handleChange}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                name="description"
                value={Array.isArray(editableNode.description) 
                  ? editableNode.description.join('\n') 
                  : editableNode.description || ''}
                onChange={(e) => {
                  setEditableNode(prev => ({
                    ...prev,
                    description: e.target.value.split('\n')
                  }));
                }}
                className="w-full min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Time Needed (hours)</label>
              <Input
                type="number"
                name="timeNeeded"
                value={editableNode.timeNeeded || 0}
                onChange={handleChange}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Time Consumed (hours)</label>
              <Input
                type="number"
                name="timeConsumed"
                value={editableNode.timeConsumed || 0}
                onChange={handleChange}
                className="w-full"
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleSave} className="flex-1">
                Save
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">{editableNode.title}</h2>
              <div className="space-y-2">
                <h3 className="font-medium">Description</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {Array.isArray(editableNode.description) 
                    ? editableNode.description.map((desc, index) => (
                        <li key={index} className="text-sm">{desc}</li>
                      ))
                    : <li className="text-sm">{editableNode.description}</li>
                  }
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Progress</h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
              <p className="text-sm mt-1">
                {editableNode.timeConsumed || 0} / {editableNode.timeNeeded || 0} hours
              </p>
            </div>

            {editableNode.deadline && (
              <div>
                <h3 className="font-medium">Deadline</h3>
                <p className="text-sm">
                  {format(new Date(editableNode.deadline), 'PPP')}
                </p>
              </div>
            )}

            <Button onClick={() => setIsEditing(true)} className="w-full">
              Edit Node
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = (props) => {
  const { isMobile, node } = props;

  if (isMobile) {
    return (
      <div className="md:hidden">
        <Sheet open={!!node} onOpenChange={() => props.onClose()}>
          <SheetContent side="bottom" className="h-[80vh] w-full">
            <SheetHeader>
              <SheetTitle>Node Details</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(80vh-4rem)]">
              <NodeContent {...props} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="hidden md:block w-80 h-full border-l border-gray-200 dark:border-gray-800">
      <div className="h-full">
        <NodeContent {...props} />
      </div>
    </div>
  );
};

export default NodeDetailsPanel;
