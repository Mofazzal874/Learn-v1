"use client";

import { useState } from "react";
import RoadmapForm from "@/components/RoadmapForm";
import RoadmapCanvas from "@/components/RoadmapCanvas";
import { RoadmapNode, RoadmapEdge } from "@/types";
import { useRouter } from "next/navigation";

export default function CreateRoadmap() {
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [edges, setEdges] = useState<RoadmapEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async (formData: any) => {
    setLoading(true);
    try {
      const response = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to generate roadmap");

      const data = await response.json();
      setNodes(data.nodes);
      setEdges(data.edges);
    } catch (error) {
      console.error("Error:", error);
      // Add error handling UI here
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/roadmap/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) throw new Error("Failed to save roadmap");

      const data = await response.json();
      router.push(`/roadmap/${data._id}`);
    } catch (error) {
      console.error("Error:", error);
      // Add error handling UI here
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/4 p-4 border-r border-gray-200">
        <RoadmapForm onGenerate={handleGenerate} />
      </div>
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
          </div>
        ) : nodes.length > 0 ? (
          <>
            <RoadmapCanvas
              nodes={nodes}
              edges={edges}
              onUpdateNodes={setNodes}
              onUpdateEdges={setEdges}
            />
            <button
              onClick={handleSave}
              className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
              Save Roadmap
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Generate a roadmap to get started
          </div>
        )}
      </div>
    </div>
  );
} 