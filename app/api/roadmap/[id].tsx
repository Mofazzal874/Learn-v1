// pages/roadmap/[id].tsx
"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import RoadmapForm, { RoadmapFormData } from "../../../components/RoadmapForm";
import RoadmapCanvas from "../../../components/RoadmapCanvas";
import axios from "axios";
import { RoadmapNode } from "../../../types";
import { Button } from "../../../components/ui/button";
import React from "react";

const RoadmapPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (id) fetchRoadmap();
  }, [id]);

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/roadmap/${id}`);
      setRoadmap(res.data);
    } catch (error) {
      console.error(error);
      // Handle error (e.g., redirect to 404)
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (data: RoadmapFormData) => {
    setGenerating(true);
    try {
      const res = await axios.post("/api/roadmap/generate", {
        roadmapId: id,
        prompt: data.prompt,
        level: data.level,
        roadmapType: data.roadmapType,
      });
      setRoadmap(res.data);
    } catch (error) {
      console.error(error);
      // Handle error
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateNodes = async (updatedNodes: RoadmapNode[]) => {
    try {
      await axios.put(`/api/roadmap/update/${id}`, {
        nodes: updatedNodes,
      });
      setRoadmap((prev: any) => ({ ...prev, nodes: updatedNodes }));
    } catch (error) {
      console.error(error);
      // Handle error
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Your Roadmap</h1>
      {!roadmap ? (
        <RoadmapForm onGenerate={handleGenerate} />
      ) : (
        <>
          <RoadmapCanvas 
            nodes={roadmap.nodes} 
            edges={roadmap.edges} 
            onUpdateNodes={handleUpdateNodes} 
            onUpdateEdges={(updatedEdges) => setRoadmap((prev: any) => ({ ...prev, edges: updatedEdges }))} 
          />
          {/* Add additional controls here */}
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </>
      )}
      {generating && <div>Generating roadmap...</div>}
    </div>
  );
};

export default RoadmapPage;
