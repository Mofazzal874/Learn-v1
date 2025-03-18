// components/RoadmapForm.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Settings, Map, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RoadmapFormData {
  prompt: string;
  level: "beginner" | "intermediate" | "advanced";
  roadmapType: "week-by-week" | "topic-wise";
}

type FormContentProps = {
  formData: RoadmapFormData;
  handleChange: (e: { target: { name: string; value: string } }) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
};

// Move FormContent outside of the main component
const FormContent = ({ 
  formData, 
  handleChange, 
  handleSubmit,
  isLoading
}: FormContentProps) => (
  <form onSubmit={handleSubmit} className="space-y-8">
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-white">
        <Map className="w-6 h-6 text-blue-500" />
        Learning Path
      </h1>
      <p className="text-gray-400">
        Create a personalized roadmap for your learning journey
      </p>
    </div>

    <div className="space-y-6">
      <div className="space-y-4">
        <Label 
          htmlFor="prompt" 
          className="text-base font-semibold inline-flex items-center gap-2 text-white"
        >
          <Sparkles className="w-4 h-4 text-blue-500" />
          What do you want to learn?
        </Label>
        <Input
          id="prompt"
          name="prompt"
          value={formData.prompt}
          onChange={(e) => handleChange(e)}
          placeholder="e.g., Machine Learning, Web Development..."
          className="w-full text-base py-6 bg-[#0a0a0a] border-white/10 text-white placeholder:text-gray-500"
          autoComplete="off"
          required
        />
      </div>

      <div className="space-y-4">
        <Label htmlFor="level" className="text-base font-semibold text-white">
          Your Experience Level
        </Label>
        <Select 
          name="level" 
          value={formData.level} 
          onValueChange={(value: string) => handleChange({ target: { name: 'level', value }})}
        >
          <SelectTrigger className="w-full bg-[#0a0a0a] border-white/10 text-white">
            <SelectValue placeholder="Select your level" />
          </SelectTrigger>
          <SelectContent className="bg-[#141414] border-white/10">
            <SelectItem value="beginner" className="text-white hover:bg-blue-500/10">Beginner</SelectItem>
            <SelectItem value="intermediate" className="text-white hover:bg-blue-500/10">Intermediate</SelectItem>
            <SelectItem value="advanced" className="text-white hover:bg-blue-500/10">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label htmlFor="roadmapType" className="text-base font-semibold text-white">
          Learning Structure
        </Label>
        <Select 
          name="roadmapType" 
          value={formData.roadmapType} 
          onValueChange={(value: string) => handleChange({ target: { name: 'roadmapType', value }})}
        >
          <SelectTrigger className="w-full bg-[#0a0a0a] border-white/10 text-white">
            <SelectValue placeholder="Select roadmap type" />
          </SelectTrigger>
          <SelectContent className="bg-[#141414] border-white/10">
            <SelectItem value="week-by-week" className="text-white hover:bg-blue-500/10">Week by Week</SelectItem>
            <SelectItem value="topic-wise" className="text-white hover:bg-blue-500/10">Topic-wise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button 
        type="submit" 
        className="w-full py-6 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
        size="lg"
        disabled={isLoading}
      >
        {isLoading ? "Generating..." : "Generate Roadmap"}
      </Button>
    </div>
  </form>
);

const RoadmapForm: React.FC<{ onGenerate: (data: RoadmapFormData) => void; isLoading: boolean }> = ({ onGenerate, isLoading }) => {
  const [formData, setFormData] = useState<RoadmapFormData>({
    prompt: "",
    level: "beginner",
    roadmapType: "topic-wise"
  });

  const handleChange = (e: { target: { name: string; value: string } }) => {
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
            <Button 
              variant="outline" 
              size="icon" 
              className="fixed bottom-6 right-6 z-50 h-12 w-12 shadow-lg bg-[#141414] border-white/10 text-white hover:bg-[#1a1a1a]"
            >
              <Settings className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] bg-[#141414] border-t border-white/10">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-white">Create Roadmap</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto">
              <FormContent 
                formData={formData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block p-8">
        <FormContent 
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </>
  );
};

export default RoadmapForm;
