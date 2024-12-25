// components/NodeDetailsPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import { RoadmapNode } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NodeDetailsPanelProps {
  node: RoadmapNode;
  onClose: () => void;
  onUpdate: (node: RoadmapNode) => void;
}

const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
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
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setEditableNode((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDescriptionChange = (index: number, value: string) => {
    setEditableNode((prev) => ({
      ...prev,
      description: prev.description?.map((desc, i) => 
        i === index ? value : desc
      ) || [],
    }));
  };

  const addDescriptionPoint = () => {
    setEditableNode((prev) => ({
      ...prev,
      description: [...(prev.description || []), ""],
    }));
  };

  const removeDescriptionPoint = (index: number) => {
    setEditableNode((prev) => ({
      ...prev,
      description: prev.description?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSave = async () => {
    onUpdate(editableNode);
    setIsEditing(false);
  };

  const calculateProgress = () => {
    if (!editableNode.timeNeeded || !editableNode.timeConsumed) return 0;
    return Math.min((editableNode.timeConsumed / editableNode.timeNeeded) * 100, 100);
  };

  return (
    <ScrollArea className="w-96 h-screen bg-white dark:bg-gray-800 p-6 border-l">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{isEditing ? "Edit Node" : "Node Details"}</h2>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                name="title"
                value={editableNode.title}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description Points</label>
              {editableNode.description?.map((desc, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={desc}
                    onChange={(e) => handleDescriptionChange(index, e.target.value)}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeDescriptionPoint(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addDescriptionPoint}
                className="mt-2"
              >
                Add Point
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Time Needed (hours)</label>
              <Input
                type="number"
                name="timeNeeded"
                value={editableNode.timeNeeded || ""}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Time Consumed (hours)</label>
              <Input
                type="number"
                name="timeConsumed"
                value={editableNode.timeConsumed || ""}
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">Save</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Title</h3>
              <p>{editableNode.title}</p>
            </div>

            <div>
              <h3 className="font-medium">Description</h3>
              <ul className="list-disc pl-5 space-y-1">
                {editableNode.description?.map((desc, index) => (
                  <li key={index}>{desc}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium">Progress</h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
              <p className="text-sm mt-1">
                {editableNode.timeConsumed || 0} / {editableNode.timeNeeded || 0} hours
              </p>
            </div>

            <Button onClick={() => setIsEditing(true)} className="w-full">
              Edit Node
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default NodeDetailsPanel;
