// types/index.ts

export interface RoadmapNode {
  id: string;
  title: string;
  description: string[];
  children: string[];
  sequence: number;
  timeNeeded: number;
  timeConsumed: number;
  completed: boolean;
  position: {
    x: number;
    y: number;
  };
  completionTime?: string;
  deadline?: string;
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
  type?: string; // Optional: define custom edge types if needed
  animated?: boolean;
  label?: string;
}

export interface SuggestedCourse {
  courseId: string;
  nodeId: string;
  status: boolean;
}

export interface SuggestedVideo {
  videoId: string;
  nodeId: string;
  status: boolean;
}

export interface CourseInfo {
  _id: string;
  title: string;
  slug: string;
}

export interface VideoInfo {
  _id: string;
  title: string;
  slug: string;
}
