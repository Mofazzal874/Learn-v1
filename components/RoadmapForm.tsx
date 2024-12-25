// components/RoadmapForm.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Settings } from "lucide-react";

interface RoadmapFormData {
  prompt: string;
  level: "beginner" | "intermediate" | "advanced";
  roadmapType: "week-by-week" | "topic-wise";
}

const RoadmapForm: React.FC<{ onGenerate: (data: RoadmapFormData) => void }> = ({ onGenerate }) => {
  const [formData, setFormData] = useState<RoadmapFormData>({
    prompt: "",
    level: "beginner",
    roadmapType: "topic-wise"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form data:", formData);
    onGenerate(formData);
  };

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
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
          className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="week-by-week">Week by Week</option>
          <option value="topic-wise">Topic-wise</option>
        </select>
      </div>

      <Button type="submit" className="w-full">
        Generate Roadmap
      </Button>
    </form>
  );

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="fixed bottom-4 right-4 z-50">
              <Settings className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Roadmap Settings</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <FormContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block p-4">
        <FormContent />
      </div>
    </>
  );
};

export default RoadmapForm;
