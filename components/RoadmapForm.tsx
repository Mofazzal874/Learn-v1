// components/RoadmapForm.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Settings, Info } from "lucide-react";

interface RoadmapFormData {
  prompt: string;
  level: "beginner" | "intermediate" | "advanced";
  roadmapType: "week-by-week" | "topic-wise";
}

const LabelWithInfo = ({ children, info }: { children: React.ReactNode, info: string }) => (
  <div>
    <Label className="inline-flex items-center">
      {children}
      <div className="group relative ml-1">
        <Info className="h-4 w-4 text-gray-400" />
        <div className="absolute left-0 bottom-full mb-2 hidden w-48 rounded bg-gray-800 p-2 text-xs text-white group-hover:block z-10">
          {info}
          <div className="absolute left-0 top-full h-2 w-2 -translate-x-1/2 transform rotate-45 bg-gray-800"></div>
        </div>
      </div>
    </Label>
  </div>
);

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
    {/* Tips Section */}
    <div className="mb-4 border border-blue-200 rounded-md">
      <div 
        className="p-3 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 flex items-center cursor-pointer"
        onClick={() => {
          const content = document.getElementById('tipContent');
          if (content) {
            content.classList.toggle('hidden');
          }
        }}
      >
        <Info className="h-4 w-4 mr-2" /> Tips for better roadmaps
      </div>
      <div id="tipContent" className="hidden p-3 text-xs space-y-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-b-md">
        <p><strong>Best topics:</strong> Specific skills, technologies, or educational subjects</p>
        <p><strong>Examples:</strong> "React development", "Data Science", "Digital Marketing", "French language"</p>
        <p><strong>Avoid:</strong> Questions, problems, or very general topics</p>
        <p><strong>For best results:</strong> Be specific about what you want to learn</p>
      </div>
    </div>

    <div className="space-y-2">
      <LabelWithInfo info="Enter a specific learning topic or skill you want to master. Be specific and focused for better results.">
        What do you want to learn?
      </LabelWithInfo>
      <Input
        id="prompt"
        name="prompt"
        value={formData.prompt}
        onChange={handleChange}
        placeholder="e.g., Machine Learning, Web Development, Spanish"
        className="w-full"
        autoComplete="off"
        required
      />
      <p className="text-xs text-gray-500 mt-1">3-50 characters, educational topics only</p>
    </div>

    <div className="space-y-2">
      <LabelWithInfo info="Select your current knowledge level. This affects the complexity and depth of the roadmap.">
        Your Level
      </LabelWithInfo>
      <select
        id="level"
        name="level"
        value={formData.level}
        onChange={handleChange}
        className="w-full p-2 border rounded bg-background text-foreground 
          dark:bg-gray-800 dark:text-white dark:border-gray-700
          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="beginner" className="bg-background dark:bg-gray-800">Beginner (new to topic)</option>
        <option value="intermediate" className="bg-background dark:bg-gray-800">Intermediate (some experience)</option>
        <option value="advanced" className="bg-background dark:bg-gray-800">Advanced (seeking mastery)</option>
      </select>
      <p className="text-xs text-gray-500 mt-1">Affects complexity and number of steps</p>
    </div>

    <div className="space-y-2">
      <LabelWithInfo info="Week-by-week organizes learning by time periods. Topic-wise organizes by concept relationships.">
        Roadmap Type
      </LabelWithInfo>
      <select
        id="roadmapType"
        name="roadmapType"
        value={formData.roadmapType}
        onChange={handleChange}
        className="w-full p-2 border rounded bg-background text-foreground 
          dark:bg-gray-800 dark:text-white dark:border-gray-700
          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="week-by-week" className="bg-background dark:bg-gray-800">Week by Week (time-based)</option>
        <option value="topic-wise" className="bg-background dark:bg-gray-800">Topic-wise (concept-based)</option>
      </select>
      <p className="text-xs text-gray-500 mt-1">Different ways to organize your learning</p>
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
              <SheetTitle>Generate Your Learning Roadmap</SheetTitle>
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
        <h2 className="text-lg font-semibold mb-4">Create Your Learning Path</h2>
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
