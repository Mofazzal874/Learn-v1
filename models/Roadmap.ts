// models/Roadmap.ts

import mongoose, { Schema, Document } from "mongoose";

interface IRoadmapNode {
  id: string;
  title: string;
  description?: string[];
  completed: boolean;
  completionTime?: Date;
  deadline?: Date;
  timeNeeded?: number;
  timeConsumed?: number;
  children: string[];
  position: {
    x: number;
    y: number;
  };
}

interface IRoadmapEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  label?: string;
}

export interface IRoadmap extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  level: "beginner" | "intermediate" | "advanced";
  roadmapType: "week-by-week" | "topic-wise";
  treeDirection: "top-down" | "bottom-up";
  nodes: IRoadmapNode[];
  edges: IRoadmapEdge[];
  suggestedCourse: {
    courseId: mongoose.Types.ObjectId;
    nodeId: string;
    status: boolean;
  }[];
  suggestedVideos: {
    videoId: mongoose.Types.ObjectId;
    nodeId: string;
    status: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const RoadmapNodeSchema: Schema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: [{ type: String }],
  completed: { type: Boolean, default: false },
  completionTime: { type: Date },
  deadline: { type: Date },
  timeNeeded: { type: Number },
  timeConsumed: { type: Number },
  children: [{ type: String }],
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
});

const RoadmapEdgeSchema: Schema = new Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  type: { type: String },
  animated: { type: Boolean, default: false },
  label: { type: String },
});

const RoadmapSchema: Schema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true },
    roadmapType: { type: String, enum: ["week-by-week", "topic-wise"], required: true },
    treeDirection: { type: String, enum: ["top-down", "bottom-up"], default: "top-down" },
    nodes: [RoadmapNodeSchema],
    edges: [RoadmapEdgeSchema],
    suggestedCourse: [{
      courseId: { type: mongoose.Types.ObjectId, ref: "Course", required: true },
      nodeId: { type: String, required: true },
      status: { type: Boolean, default: false }
    }],
    suggestedVideos: [{
      videoId: { type: mongoose.Types.ObjectId, ref: "Video", required: true },
      nodeId: { type: String, required: true },
      status: { type: Boolean, default: false }
    }],
  },
  { timestamps: true }
);

export const Roadmap = mongoose.models?.Roadmap || mongoose.model<IRoadmap>("Roadmap", RoadmapSchema);
