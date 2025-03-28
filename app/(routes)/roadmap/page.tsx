"use client";

import { useState } from "react";
import RoadmapForm from "@/components/RoadmapForm";
import RoadmapCanvas from "@/components/RoadmapCanvas";
import RoadmapError from "@/components/RoadmapError";
import { RoadmapNode, RoadmapEdge } from "@/types";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";

export default function CreateRoadmap() {
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [edges, setEdges] = useState<RoadmapEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFormData, setLastFormData] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
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

  const handleSave = async () => {
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
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)]">
        <div className="hidden md:block md:w-80 border-r border-gray-200 dark:border-gray-800">
          <RoadmapForm onGenerate={handleGenerate} />
        </div>
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <RoadmapError 
                error={error} 
                onRetry={handleRetry} 
              />
            </div>
          ) : nodes.length > 0 ? (
            <>
              <RoadmapCanvas
                nodes={nodes}
                edges={edges}
                onUpdateNodes={setNodes}
                onUpdateEdges={setEdges}
              />
              <Button
                onClick={handleSave}
                className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded"
              >
                Save Roadmap
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Generate a roadmap to get started
            </div>
          )}
        </div>
      </div>
    </>
  );
} 