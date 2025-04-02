"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Map, Plus } from "lucide-react";
import { toast } from "sonner";

interface SavedRoadmap {
  _id: string; // MongoDB uses _id
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function SavedRoadmaps() {
  const [roadmaps, setRoadmaps] = useState<SavedRoadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    try {
      console.log("Fetching saved roadmaps");
      const response = await fetch("/api/roadmap/saved");
      if (!response.ok) throw new Error("Failed to fetch roadmaps");
      
      const data = await response.json();
      console.log("Received roadmaps:", data.length);
      
      // Ensure we have valid data with _id fields
      if (Array.isArray(data)) {
        setRoadmaps(data);
      } else {
        console.error("Invalid roadmap data format:", data);
        toast.error("Received invalid roadmap data format");
      }
    } catch (error) {
      console.error("Error fetching roadmaps:", error);
      toast.error("Failed to load saved roadmaps");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Saved Roadmaps</h1>
          <p className="text-gray-400">Access and manage your learning roadmaps</p>
        </div>
        <Button
          onClick={() => router.push("/roadmap")}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Roadmap
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roadmaps.map((roadmap) => {
          // Ensure we have a valid ID
          const roadmapId = roadmap._id;
          if (!roadmapId) {
            console.error("Roadmap missing _id:", roadmap);
            return null;
          }
          
          return (
            <Card
              key={roadmapId}
              className="bg-[#141414] border-white/10 hover:border-blue-500/50 transition-colors cursor-pointer"
              onClick={() => {
                console.log(`Navigating to roadmap: ${roadmapId}`, roadmap);
                router.push(`/roadmap/saved/${roadmapId}`);
              }}
            >
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Map className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-white">{roadmap.name || 'Unnamed Roadmap'}</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Last updated: {roadmap.updatedAt ? new Date(roadmap.updatedAt).toLocaleDateString() : 'Unknown'}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {roadmaps.length === 0 && (
        <div className="text-center py-12">
          <Map className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No saved roadmaps yet</h3>
          <p className="text-gray-400 mb-6">Create your first learning roadmap to get started</p>
          <Button
            onClick={() => router.push("/roadmap")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Roadmap
          </Button>
        </div>
      )}
    </div>
  );
} 