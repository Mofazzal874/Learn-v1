// types/index.ts

export interface RoadmapNode {
  id: string;
  title: string;
  description?: string[];
  completed: boolean;
  completionTime?: string; // ISO string
  deadline?: string; // ISO string
  timeNeeded?: number;
  timeConsumed?: number;
  children: string[];
  position: {
    x: number;
    y: number;
  };
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
  type?: string; // Optional: define custom edge types if needed
  animated?: boolean;
  label?: string;
}
