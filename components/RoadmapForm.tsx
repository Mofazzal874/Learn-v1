// components/RoadmapForm.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface RoadmapFormProps {
  onGenerate: (data: RoadmapFormData) => void;
}

export interface RoadmapFormData {
  prompt: string;
  level: "beginner" | "intermediate" | "advanced";
  roadmapType: "week-by-week" | "topic-wise";
  treeDirection: "top-down" | "bottom-up";
}

const RoadmapForm: React.FC<RoadmapFormProps> = ({ onGenerate }) => {
  const [formData, setFormData] = useState<RoadmapFormData>({
    prompt: "",
    level: "beginner",
    roadmapType: "topic-wise",
    treeDirection: "top-down",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white dark:bg-black rounded-md shadow">
      <div>
        <Label htmlFor="prompt">What do you want to learn?</Label>
        <Input
          id="prompt"
          name="prompt"
          value={formData.prompt}
          onChange={handleChange}
          placeholder="e.g., Machine Learning"
          required
        />
      </div>

      <div>
        <Label htmlFor="level">Your Level</Label>
        <select
          id="level"
          name="level"
          value={formData.level}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div>
        <Label htmlFor="roadmapType">Roadmap Type</Label>
        <select
          id="roadmapType"
          name="roadmapType"
          value={formData.roadmapType}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="week-by-week">Week by Week</option>
          <option value="topic-wise">Topic-wise</option>
        </select>
      </div>

      <div>
        <Label htmlFor="treeDirection">Tree Direction</Label>
        <select
          id="treeDirection"
          name="treeDirection"
          value={formData.treeDirection}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="top-down">Top-Down</option>
          <option value="bottom-up">Bottom-Up</option>
        </select>
      </div>

      <Button type="submit" className="w-full">
        Generate Roadmap
      </Button>
    </form>
  );
};

export default RoadmapForm;
