"use client";

import { useState } from "react";
import RoadmapForm from "@/components/RoadmapForm";
import RoadmapCanvas from "@/components/RoadmapCanvas";
import RoadmapError from "@/components/RoadmapError";
import { RoadmapNode, RoadmapEdge } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Map, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreateRoadmap() {
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [edges, setEdges] = useState<RoadmapEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFormData, setLastFormData] = useState<{
    prompt: string;
    level: "beginner" | "intermediate" | "advanced";
    roadmapType: "week-by-week" | "topic-wise";
  } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

  const handleGenerate = async (formData: any, isRetry = false) => {
    setLoading(true);
    setError(null);
    setLastFormData(formData);
    
    if (isRetry) {
      setRetryCount(prev => prev + 1);
    } else {
      setRetryCount(0);
    }
    
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
        const errorMsg = data.error || "Failed to generate roadmap";
        const detailsMsg = data.details ? `: ${data.details}` : "";
        console.error(`API Error: ${errorMsg}${detailsMsg}`);
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      if (!data.nodes || data.nodes.length === 0) {
        const errorMsg = "No roadmap nodes were generated. Please try again.";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      setNodes(data.nodes);
      setEdges(data.edges);
      setError(null);
      toast.success("Roadmap generated successfully!");
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate roadmap");
      
      // Error is already set in the try block
      if (!error.message.includes("No roadmap nodes were generated")) {
        setError(error.message || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFormData) {
      // If we've tried 3 times, try with slightly modified parameters
      if (retryCount >= 2) {
        // Modify the prompt slightly to help the model
        const modifiedPromData = {
          ...lastFormData,
          prompt: `${lastFormData.prompt} curriculum`, // Add "curriculum" to make it more educational
        };
        handleGenerate(modifiedPromData, true);
        toast.info("Trying with modified parameters...");
      } else {
        handleGenerate(lastFormData, true);
      }
    } else {
      setError(null);
    }
  };

  const handleSave = async (name: string) => {
    setSaving(true);
    try {
      console.log("Starting to save roadmap with name:", name);
      
      // Create a sanitized version of nodes and edges to prevent circular references
      const sanitizedNodes = nodes.map(node => ({
        id: node.id,
        title: node.title,
        description: node.description,
        completed: node.completed,
        completionTime: node.completionTime,
        deadline: node.deadline,
        timeNeeded: node.timeNeeded,
        timeConsumed: node.timeConsumed,
        children: node.children,
        position: node.position,
        sequence: node.sequence
      }));
      
      const sanitizedEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        animated: edge.animated,
        label: edge.label
      }));
      
      console.log("Sanitized data:", { 
        nodeCount: sanitizedNodes.length, 
        edgeCount: sanitizedEdges.length 
      });
      
      const response = await fetch("/api/roadmap/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nodes: sanitizedNodes,
          edges: sanitizedEdges,
          level: lastFormData?.level || "beginner",
          roadmapType: lastFormData?.roadmapType || "topic-wise",
        }),
      });

      console.log("Save response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "Failed to save roadmap");
      }

      const result = await response.json();
      console.log("Save successful, got result:", result);
      
      toast.success("Roadmap saved successfully");
      router.push("/roadmap/saved");
    } catch (error) {
      console.error("Error saving roadmap:", error);
      toast.error("Failed to save roadmap");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
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
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <RoadmapError 
                error={error} 
                onRetry={handleRetry} 
              />
            </div>
          ) : nodes.length > 0 ? (
            <div className="h-full relative">
              <RoadmapCanvas
                nodes={nodes}
                edges={edges}
                onUpdateNodes={setNodes}
                onUpdateEdges={setEdges}
                isFormCollapsed={isSidebarCollapsed}
                onSave={handleSave}
                isSaving={saving}
              />
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