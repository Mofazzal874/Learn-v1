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

// Move FormContent outside of the main component
const FormContent = ({ 
  formData, 
  handleChange, 
  handleSubmit 
}: { 
  formData: RoadmapFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}) => (
  <form onSubmit={handleSubmit} className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="prompt">What do you want to learn?</Label>
      <Input
        id="prompt"
        name="prompt"
        value={formData.prompt}
        onChange={handleChange}
        placeholder="e.g., Machine Learning"
        className="w-full"
        autoComplete="off"
        required
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="level">Your Level</Label>
      <select
        id="level"
        name="level"
        value={formData.level}
        onChange={handleChange}
        className="w-full p-2 border rounded bg-background text-foreground 
          dark:bg-gray-800 dark:text-white dark:border-gray-700
          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="beginner" className="bg-background dark:bg-gray-800">Beginner</option>
        <option value="intermediate" className="bg-background dark:bg-gray-800">Intermediate</option>
        <option value="advanced" className="bg-background dark:bg-gray-800">Advanced</option>
      </select>
    </div>

    <div className="space-y-2">
      <Label htmlFor="roadmapType">Roadmap Type</Label>
      <select
        id="roadmapType"
        name="roadmapType"
        value={formData.roadmapType}
        onChange={handleChange}
        className="w-full p-2 border rounded bg-background text-foreground 
          dark:bg-gray-800 dark:text-white dark:border-gray-700
          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="week-by-week" className="bg-background dark:bg-gray-800">Week by Week</option>
        <option value="topic-wise" className="bg-background dark:bg-gray-800">Topic-wise</option>
      </select>
    </div>

    <Button type="submit" className="w-full">
      Generate Roadmap
    </Button>
  </form>
);

const RoadmapForm: React.FC<{ onGenerate: (data: RoadmapFormData) => void }> = ({ onGenerate }) => {
  const [formData, setFormData] = useState<RoadmapFormData>({
    prompt: "",
    level: "beginner",
    roadmapType: "topic-wise"
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

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
              <FormContent 
                formData={formData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block p-4">
        <FormContent 
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
      </div>
    </>
  );
};

export default RoadmapForm;
