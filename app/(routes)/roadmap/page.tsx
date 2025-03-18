"use client";

import { useState } from "react";
import RoadmapForm from "@/components/RoadmapForm";
import RoadmapCanvas from "@/components/RoadmapCanvas";
import { RoadmapNode, RoadmapEdge } from "@/types";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Map, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreateRoadmap() {
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [edges, setEdges] = useState<RoadmapEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

  const handleGenerate = async (formData: any) => {
    setLoading(true);
    try {
      console.log("Sending request with data:", formData);
      
      const response = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: formData.prompt,
          level: formData.level,
          roadmapType: formData.roadmapType
        }),
      });

      console.log("Response status:", response.status);
      
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate roadmap");
      }

      setNodes(data.nodes);
      setEdges(data.edges);
      toast.success("Roadmap generated successfully!");
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate roadmap");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/roadmap/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save roadmap");
      }

      const data = await response.json();
      toast.success("Roadmap saved successfully!");
      router.push(`/roadmap/${data._id}`);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to save roadmap");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Toaster position="top-center" />
      <div className="flex flex-col md:flex-row h-screen">
        {/* Sidebar Form */}
        <div 
          className={cn(
            "hidden md:flex flex-col border-r border-white/10 bg-[#141414] transition-all duration-300 ease-in-out relative",
            isSidebarCollapsed ? "md:w-0" : "md:w-96"
          )}
        >
          <div className={cn(
            "h-full overflow-y-auto transition-opacity duration-300",
            isSidebarCollapsed ? "opacity-0" : "opacity-100"
          )}>
            <RoadmapForm onGenerate={handleGenerate} isLoading={loading} />
          </div>

          {/* Collapse Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 z-50 h-12 w-6 rounded-none rounded-r-xl border border-l-0 border-white/10 bg-[#141414] hover:bg-[#1a1a1a] text-white transition-all duration-300",
              isSidebarCollapsed 
                ? "-right-6 translate-x-0" // When collapsed, stick to the right of collapsed form
                : "-right-6" // When expanded, stick to the right of expanded form
            )}
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative bg-[#0a0a0a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a0a]/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-blue-500/20 animate-pulse" />
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-semibold tracking-tight text-white">
                  Generating Your Roadmap
                </h3>
                <p className="text-gray-400">
                  Please wait while we create your personalized learning path...
                </p>
              </div>
            </div>
          ) : nodes.length > 0 ? (
            <div className="h-full relative">
              <RoadmapCanvas
                nodes={nodes}
                edges={edges}
                onUpdateNodes={setNodes}
                onUpdateEdges={setEdges}
                isFormCollapsed={isSidebarCollapsed}
              />
              <div className="absolute bottom-6 right-6">
                <Card className="bg-[#141414] border-white/10">
                  <Button
                    onClick={handleSave}
                    size="lg"
                    className="px-8 bg-blue-600 hover:bg-blue-700"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Roadmap'
                    )}
                  </Button>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-6 p-8">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-blue-500/20" />
                <Map className="h-12 w-12 text-blue-500" />
              </div>
              <div className="space-y-2 text-center max-w-md">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Create Your Learning Roadmap
                </h2>
                <p className="text-gray-400">
                  Generate a personalized learning path tailored to your goals and experience level. 
                  Start by describing what you want to learn.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 