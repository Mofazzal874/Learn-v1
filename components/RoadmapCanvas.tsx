// components/RoadmapCanvas.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  Connection,
  Edge as ReactFlowEdge,
  useNodesState,
  useEdgesState,
  OnConnect,
  Node,
  Edge,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { RoadmapNode, RoadmapEdge } from "../types";
import NodeDetailsPanel from "./NodeDetailsPanel";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface RoadmapCanvasProps {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  onUpdateNodes: (nodes: RoadmapNode[]) => void;
  onUpdateEdges: (edges: RoadmapEdge[]) => void;
}

// Mapping functions
const mapRoadmapNodesToReactFlowNodes = (roadmapNodes: RoadmapNode[]): Node[] => {
  return roadmapNodes.map((node) => ({
    id: node.id,
    data: {
      label: node.title,
      description: node.description,
      completed: node.completed,
      completionTime: node.completionTime,
      deadline: node.deadline,
      timeNeeded: node.timeNeeded,
      timeConsumed: node.timeConsumed,
      children: node.children,
    },
    position: node.position,
  }));
};

const mapReactFlowNodesToRoadmapNodes = (reactFlowNodes: Node[]): RoadmapNode[] => {
  return reactFlowNodes.map((node) => ({
    id: node.id,
    title: node.data.label,
    description: node.data.description,
    completed: node.data.completed,
    completionTime: node.data.completionTime,
    deadline: node.data.deadline,
    timeNeeded: node.data.timeNeeded,
    timeConsumed: node.data.timeConsumed,
    children: node.data.children,
    position: node.position,
  }));
};

const mapRoadmapEdgesToReactFlowEdges = (roadmapEdges: RoadmapEdge[]): ReactFlowEdge[] => {
  return roadmapEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    animated: edge.animated,
    label: edge.label?.toString(),
  }));
};

const mapReactFlowEdgesToRoadmapEdges = (reactFlowEdges: ReactFlowEdge[]): RoadmapEdge[] => {
  return reactFlowEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    animated: edge.animated,
    label: typeof edge.label === 'string' ? edge.label : undefined,
  }));
};

const RoadmapCanvas: React.FC<RoadmapCanvasProps> = ({
  nodes,
  edges,
  onUpdateNodes,
  onUpdateEdges,
}) => {
  const initialRfNodes = mapRoadmapNodesToReactFlowNodes(nodes);
  const initialRfEdges = mapRoadmapEdgesToReactFlowEdges(edges);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(initialRfNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(initialRfEdges);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Handle connection (edge creation)
  const onConnectHandler: OnConnect = useCallback(
    (params: Edge | Connection) =>
      setRfEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setRfEdges]
  );

  // Handle node click
  const onNodeClick = (_: React.MouseEvent, node: Node<any, any>) => {
    const roadmapNode = nodes.find((n) => n.id === node.id);
    if (roadmapNode) setSelectedNode(roadmapNode);
  };

  // Handle node drag stop
  const onNodeDragStopHandler = useCallback(
    (event: React.MouseEvent, node: Node<any, any>) => {
      const updatedNodes = rfNodes.map((n) =>
        n.id === node.id ? { ...n, position: node.position } : n
      );
      setRfNodes(updatedNodes);
    },
    [rfNodes, setRfNodes]
  );

  // Sync local nodes state with parent component
  useEffect(() => {
    const updatedRoadmapNodes = mapReactFlowNodesToRoadmapNodes(rfNodes);
    onUpdateNodes(updatedRoadmapNodes);
  }, [rfNodes, onUpdateNodes]);

  // Sync local edges state with parent component
  useEffect(() => {
    const updatedRoadmapEdges = mapReactFlowEdgesToRoadmapEdges(rfEdges);
    onUpdateEdges(updatedRoadmapEdges);
  }, [rfEdges, onUpdateEdges]);

  // Handle node update from NodeDetailsPanel
  const handleNodeUpdate = (updatedNode: RoadmapNode) => {
    // Update the node in rfNodes
    setRfNodes((nds) =>
      nds.map((n) =>
        n.id === updatedNode.id
          ? {
              ...n,
              data: {
                ...n.data,
                label: updatedNode.title,
                description: updatedNode.description,
                completed: updatedNode.completed,
                completionTime: updatedNode.completionTime,
                deadline: updatedNode.deadline,
                timeNeeded: updatedNode.timeNeeded,
                timeConsumed: updatedNode.timeConsumed,
                children: updatedNode.children,
              },
            }
          : n
      )
    );
    setSelectedNode(updatedNode);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnectHandler}
          onNodeDragStop={onNodeDragStopHandler}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls className="bottom-4 right-4" />
          <MiniMap className="bottom-4 right-16" />
          <Background />
          <Panel position="top-left" className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg">
            <div className="text-sm">
              <p>Nodes: {rfNodes.length}</p>
              <p>Completed: {rfNodes.filter(n => n.data.completed).length}</p>
            </div>
          </Panel>
        </ReactFlow>
      </div>
      {selectedNode && (
        <NodeDetailsPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={handleNodeUpdate}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};

export default RoadmapCanvas;
