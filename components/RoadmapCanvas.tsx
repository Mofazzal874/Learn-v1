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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

interface RoadmapCanvasProps {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  onUpdateNodes: (nodes: RoadmapNode[]) => void;
  onUpdateEdges: (edges: RoadmapEdge[]) => void;
  isFormCollapsed?: boolean;
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
  isFormCollapsed = false,
}) => {
  const initialRfNodes = mapRoadmapNodesToReactFlowNodes(nodes);
  const initialRfEdges = mapRoadmapEdgesToReactFlowEdges(edges);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(initialRfNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(initialRfEdges);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [isDetailsPanelCollapsed, setDetailsPanelCollapsed] = useState(false);
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
    if (roadmapNode) {
      setSelectedNode(roadmapNode);
      setDetailsPanelCollapsed(false); // Always open panel when clicking a node
    }
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
    <div className="flex h-full">
      <div className={cn(
        "flex-1 relative transition-all duration-300 ease-in-out",
        isFormCollapsed ? "ml-0" : "ml-0 md:ml-0"
      )}>
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
          <Panel position="top-left" className="bg-[#141414] text-white p-2 rounded shadow-lg">
            <div className="text-sm">
              <p>Nodes: {rfNodes.length}</p>
              <p>Completed: {rfNodes.filter(n => n.data.completed).length}</p>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {selectedNode && !isMobile && (
        <div className={cn(
          "h-full border-l border-white/10 bg-[#141414] transition-all duration-300 ease-in-out overflow-hidden",
          isDetailsPanelCollapsed ? "w-0" : "w-96"
        )}>
          <div className="relative h-full">
            {/* Collapse Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -left-6 top-1/2 -translate-y-1/2 z-50 h-12 w-6 rounded-none rounded-l-xl border border-white/10 bg-[#141414] hover:bg-[#1a1a1a] text-white"
              onClick={() => setDetailsPanelCollapsed(!isDetailsPanelCollapsed)}
            >
              {isDetailsPanelCollapsed ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            <div className={cn(
              "h-full w-96 transition-transform duration-300",
              isDetailsPanelCollapsed ? "translate-x-full" : "translate-x-0"
            )}>
              <NodeDetailsPanel
                node={selectedNode}
                onClose={() => {
                  setSelectedNode(null);
                  setDetailsPanelCollapsed(true);
                }}
                onUpdate={handleNodeUpdate}
                isMobile={isMobile}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile View */}
      {selectedNode && isMobile && (
        <Sheet>
          <SheetContent side="bottom" className="h-[90vh] bg-[#141414] border-t border-white/10">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-white">Node Details</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto">
              <NodeDetailsPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onUpdate={handleNodeUpdate}
                isMobile={isMobile}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default RoadmapCanvas;
