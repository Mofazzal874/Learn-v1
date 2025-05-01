"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoadmapCanvas from "@/components/RoadmapCanvas";
import { toast } from "sonner";
import { Edge } from "reactflow";
import { RoadmapNode, RoadmapEdge } from "@/types";

interface SavedRoadmap {
  _id: string;
  name: string;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  createdAt: string;
  updatedAt: string;
}

export default function SavedRoadmapPage({ params }: { params: { id: string } }) {
  const [roadmap, setRoadmap] = useState<SavedRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [edges, setEdges] = useState<RoadmapEdge[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // Destructure id from params properly
  const { id } = params;
  
  // Store the id to prevent dependency issues
  const roadmapId = useMemo(() => id, [id]);

  // Fetch roadmap only once when component mounts or ID changes
  useEffect(() => {
    if (roadmapId && roadmapId !== 'undefined') {
      fetchRoadmap(roadmapId);
    } else {
      console.error("Invalid roadmap ID:", roadmapId);
      toast.error("Invalid roadmap ID");
      router.push("/roadmap/saved");
    }
  }, [roadmapId, router]);

  const fetchRoadmap = async (id: string) => {
    try {
      console.log(`Fetching roadmap with ID: ${id}`);
      setLoading(true);
      
      const response = await fetch(`/api/roadmap/saved/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch roadmap: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Received roadmap data:", data.name);
      
      if (!data || !data.nodes || !data.edges) {
        throw new Error("Invalid roadmap data received");
      }
      
      setRoadmap(data);
      setNodes(data.nodes);
      setEdges(data.edges);
    } catch (error) {
      console.error("Error fetching roadmap:", error);
      toast.error("Failed to load roadmap");
      router.push("/roadmap/saved");
    } finally {
      setLoading(false);
    }
  };

  // Handle node changes
  const handleNodeChange = useCallback((newNodes: RoadmapNode[]) => {
    setNodes(newNodes);
  }, []);

  // Handle edge changes
  const handleEdgeChange = useCallback((newEdges: RoadmapEdge[]) => {
    setEdges(newEdges);
  }, []);

  const handleSave = useCallback(async () => {
    if (!roadmapId || roadmapId === 'undefined') {
      toast.error("Invalid roadmap ID");
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Create a safe copy of nodes and edges for serialization
      const sanitizedNodes = nodes.map(node => ({
        id: node.id,
        title: node.title,
        description: node.description || [],
        children: node.children || [],
        sequence: node.sequence || 0,
        timeNeeded: node.timeNeeded || 0,
        timeConsumed: node.timeConsumed || 0,
        completed: node.completed || false,
        position: node.position || { x: 0, y: 0 },
        completionTime: node.completionTime,
        deadline: node.deadline
      }));
      
      const sanitizedEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        animated: edge.animated,
        label: edge.label
      }));
      
      const response = await fetch(`/api/roadmap/saved/${roadmapId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roadmap?.name || "Updated Roadmap",
          nodes: sanitizedNodes,
          edges: sanitizedEdges,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update roadmap");
      }

      toast.success("Roadmap updated successfully");
    } catch (error) {
      console.error("Error updating roadmap:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update roadmap");
    } finally {
      setIsSaving(false);
    }
  }, [roadmapId, nodes, edges, roadmap?.name]);

  const handleDelete = useCallback(async () => {
    if (!roadmapId || roadmapId === 'undefined' || !confirm("Are you sure you want to delete this roadmap?")) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/roadmap/saved/${roadmapId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete roadmap");
      }

      toast.success("Roadmap deleted successfully");
      router.push("/roadmap/saved");
    } catch (error) {
      console.error("Error deleting roadmap:", error);
      toast.error("Failed to delete roadmap");
    } finally {
      setIsDeleting(false);
    }
  }, [roadmapId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/roadmap/saved")}
            className="mr-4"
            style={{ backgroundColor: "#161616" }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {roadmap?.name || "Roadmap"}
            </h1>
            <p className="text-gray-400 text-sm">
              Created: {roadmap?.createdAt ? new Date(roadmap.createdAt).toLocaleString() : "Unknown"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="destructive"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Delete
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-11rem)] w-full bg-[#0B0B0B] rounded-lg border border-white/10">
        {nodes.length > 0 && edges.length > 0 && (
          <RoadmapCanvas
            nodes={nodes}
            edges={edges}
            onUpdateNodes={handleNodeChange}
            onUpdateEdges={handleEdgeChange}
            readOnly={false}
          />
        )}
      </div>
    </div>
  );
} 