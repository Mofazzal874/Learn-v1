// components/NodeDetailsPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import { RoadmapNode } from "../types";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    setEditableNode(node);
  }, [node]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    setEditableNode((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { value } = e.target;
    setEditableNode((prev) => ({
      ...prev,
      description: value.split("\n"),
    }));
  };

  const handleSave = () => {
    onUpdate(editableNode);
    onClose();
    // Optionally, trigger backend update via API
  };

  return (
    <div className="w-1/3 p-4 bg-gray-100 dark:bg-gray-800 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Node Details</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            name="title"
            value={editableNode.title}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={editableNode.description?.join("\n") || ""}
            onChange={handleDescriptionChange}
            className="w-full p-2 border rounded"
            rows={4}
          ></textarea>
        </div>

        <div>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="completed"
              checked={editableNode.completed}
              onChange={handleChange}
              className="form-checkbox"
            />
            <span className="ml-2">Completed</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium">Deadline</label>
          <input
            type="date"
            name="deadline"
            value={editableNode.deadline?.substring(0, 10) || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Time Needed (hours)</label>
          <input
            type="number"
            name="timeNeeded"
            value={editableNode.timeNeeded || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Time Consumed (hours)</label>
          <input
            type="number"
            name="timeConsumed"
            value={editableNode.timeConsumed || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex space-x-2">
          <Button onClick={handleSave} className="flex-1">
            Save
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NodeDetailsPanel;
