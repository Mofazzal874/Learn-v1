"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RoadmapCanvas from "@/components/RoadmapCanvas";
import RoadmapForm from "@/components/RoadmapForm";
import { RoadmapNode, RoadmapEdge } from "@/types";

export default function RoadmapView() {
  const params = useParams();
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [edges, setEdges] = useState<RoadmapEdge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const response = await fetch(`/api/roadmap/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch roadmap");
        
        const data = await response.json();
        setNodes(data.nodes);
        setEdges(data.edges);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [params.id]);

  const handleUpdateNodes = async (updatedNodes: RoadmapNode[]) => {
    setNodes(updatedNodes);
    try {
      await fetch(`/api/roadmap/update/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: updatedNodes, edges }),
      });
    } catch (error) {
      console.error("Error updating nodes:", error);
    }
  };

  const handleUpdateEdges = async (updatedEdges: RoadmapEdge[]) => {
    setEdges(updatedEdges);
    try {
      await fetch(`/api/roadmap/update/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges: updatedEdges }),
      });
    } catch (error) {
      console.error("Error updating edges:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)]">
      <div className="hidden md:block md:w-80 border-r border-gray-200 dark:border-gray-800">
        <RoadmapForm onGenerate={() => {}} isLoading={loading} />
      </div>
      <div className="flex-1">
        <RoadmapCanvas
          nodes={nodes}
          edges={edges}
          onUpdateNodes={handleUpdateNodes}
          onUpdateEdges={handleUpdateEdges}
        />
      </div>
    </div>
  );
} 