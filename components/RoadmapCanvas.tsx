// components/RoadmapCanvas.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  addEdge,
  Controls,
  Background,
  Connection,
  useNodesState,
  useEdgesState,
  OnConnect,
  Node,
  Edge,
  Panel,
  Position,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { RoadmapNode, RoadmapEdge } from "../types";
import NodeDetailsPanel from "./NodeDetailsPanel";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import RoadmapError from './RoadmapError';
import { cn } from "@/lib/utils";
import SaveRoadmapDialog from "./SaveRoadmapDialog";

interface RoadmapCanvasProps {
  // Support both prop patterns
  nodes?: RoadmapNode[];
  edges?: RoadmapEdge[];
  onUpdateNodes?: (nodes: RoadmapNode[]) => void;
  onUpdateEdges?: (edges: RoadmapEdge[]) => void;
  
  // New prop pattern
  initialNodes?: RoadmapNode[];
  initialEdges?: Edge[];
  onNodesChange?: (nodes: RoadmapNode[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  
  // Common props
  isFormCollapsed?: boolean;
  onSave?: (name: string) => Promise<void>;
  isSaving?: boolean;
  readOnly?: boolean;
  roadmapId?: string; // Optional roadmap ID for suggestions functionality
}

// Add this helper function at the top of the file (before the component)
const ensureStringTitle = (title: string | React.ReactNode): string => {
  console.log("ensureStringTitle - input:", title, "type:", typeof title);
  
  if (typeof title === 'string') {
    return title;
  }
  
  if (title && typeof title === 'object') {
    // Handle React elements in the title
    if ('props' in title && typeof title.props === 'object' && title.props && 'children' in title.props) {
      const children = title.props.children;
      console.log("ensureStringTitle - children:", children);
      
      if (Array.isArray(children)) {
        // For nested structure like our div with title + time
        for (const child of children) {
          if (child && typeof child === 'object' && 'props' in child && child.props && 'children' in child.props) {
            // This is likely the title div (first child)
            const nestedChildren = child.props.children;
            if (typeof nestedChildren === 'string') {
              console.log("ensureStringTitle - found nested title:", nestedChildren);
              return nestedChildren;
            }
          } else if (typeof child === 'string') {
            return child;
          }
        }
        // Fallback: join all string children
        return children.map((child: unknown) => 
          typeof child === 'string' ? child : ''
        ).join('').trim();
      } else if (typeof children === 'string') {
        return children;
      }
    }
    // Fallback to string representation
    return String(title);
  }
  return String(title || '');
};

// Mapping functions
const mapRoadmapNodesToReactFlowNodes = (roadmapNodes: RoadmapNode[]): Node[] => {
  return roadmapNodes.map((node) => {
    // Ensure the title is a string
    const title = ensureStringTitle(node.title);
    
    return {
      id: node.id,
      data: {
        label: title,
        description: node.description,
        completed: node.completed,
        completionTime: node.completionTime,
        deadline: node.deadline,
        timeNeeded: node.timeNeeded,
        timeConsumed: node.timeConsumed,
        children: node.children,
      },
      position: node.position,
    };
  });
};

// Function to clean unwanted patterns from title (same as in NodeDetailsPanel)
const cleanTitle = (title: string): string => {
  // Remove patterns like "4,h4,h4,h4,h4,h4,h" or "5,h5,h5,h5,h5,h" 
  // This matches patterns at the end: number followed by comma and h+number+comma sequences
  return title.replace(/\d+,(?:h\d*,?)*h?\d*$/, '').trim();
};

const mapReactFlowNodesToRoadmapNodes = (reactFlowNodes: Node[]): RoadmapNode[] => {
  return reactFlowNodes.map((node, index) => {
    // Ensure the label is a string and clean it
    const rawTitle = ensureStringTitle(node.data.label);
    const title = cleanTitle(rawTitle);
    
    return {
      id: node.id,
      title: title,
      description: node.data.description,
      completed: node.data.completed,
      completionTime: node.data.completionTime,
      deadline: node.data.deadline,
      timeNeeded: node.data.timeNeeded,
      timeConsumed: node.data.timeConsumed,
      children: node.data.children,
      position: node.position,
      sequence: index + 1
    };
  });
};

const mapRoadmapEdgesToReactFlowEdges = (roadmapEdges: RoadmapEdge[] | Edge[]): Edge[] => {
  return roadmapEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    animated: edge.animated,
    label: edge.label?.toString(),
  }));
};

const mapReactFlowEdgesToRoadmapEdges = (reactFlowEdges: Edge[]): RoadmapEdge[] => {
  return reactFlowEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    animated: edge.animated,
    label: typeof edge.label === 'string' ? edge.label : undefined,
  }));
};

const getNodeStyle = (completed: boolean = false) => ({
  padding: '8px',
  borderRadius: '8px',
  border: `2px solid ${completed ? '#22c55e' : '#e2e8f0'}`,
  background: completed ? '#dcfce7' : 'white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  width: 140,
  fontSize: '11px',
  textAlign: 'center' as const,
});

const edgeStyle = {
  stroke: '#94a3b8',
  strokeWidth: 2,
};

const RoadmapCanvas: React.FC<RoadmapCanvasProps> = ({
  // Support both prop patterns
  nodes: propNodes,
  edges: propEdges,
  onUpdateNodes,
  onUpdateEdges,
  
  // New prop pattern
  initialNodes: propInitialNodes,
  initialEdges: propInitialEdges,
  onNodesChange,
  onEdgesChange,
  
  // Common props
  isFormCollapsed = false,
  onSave,
  isSaving = false,
  readOnly = false,
  roadmapId,
}) => {
  // Determine which set of props to use
  const nodes = propNodes || propInitialNodes || [];
  const edges = propEdges || propInitialEdges || [];

  const initialRfNodes = mapRoadmapNodesToReactFlowNodes(nodes).map(node => ({
    ...node,
    style: getNodeStyle(node.data.completed),
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    data: {
      ...node.data,
      // Store the original title separately for easy access
      originalTitle: node.data.label,
      label: (
        <div className="overflow-hidden">
          <div className="font-semibold mb-1 truncate">{node.data.label}</div>
          <div className="text-xs text-gray-500">{node.data.timeNeeded || 0}h</div>
        </div>
      ),
    },
  }));
  const initialRfEdges = mapRoadmapEdgesToReactFlowEdges(edges);

  const [rfNodes, setRfNodes, onNodesChangeInternal] = useNodesState(initialRfNodes);
  const [rfEdges, setRfEdges, onEdgesChangeInternal] = useEdgesState(initialRfEdges);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [isDetailsPanelCollapsed, setDetailsPanelCollapsed] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [error, setError] = useState<string | null>(null);

  // Handle connection (edge creation)
  const onConnectHandler: OnConnect = useCallback(
    (params: Edge | Connection) => {
      if (readOnly) return;
      setRfEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setRfEdges, readOnly]
  );

  // Handle node click
  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    console.log("onNodeClick - node.data:", node.data);
    
    // Use the stored originalTitle if available, otherwise try to extract from label
    const rawTitle = node.data.originalTitle || ensureStringTitle(node.data.label);
    console.log("onNodeClick - rawTitle:", rawTitle);
    const cleanedTitle = cleanTitle(rawTitle);
    console.log("onNodeClick - cleanedTitle:", cleanedTitle);
    
    const roadmapNode: RoadmapNode = {
      id: node.id,
      title: cleanedTitle,
      description: node.data.description || [],
      completed: node.data.completed || false,
      completionTime: node.data.completionTime,
      deadline: node.data.deadline,
      timeNeeded: node.data.timeNeeded || 0,
      timeConsumed: node.data.timeConsumed || 0,
      children: node.data.children || [],
      position: node.position,
      sequence: 0 // Will be set properly when saving
    };
    
    console.log("onNodeClick - final roadmapNode:", roadmapNode);
    setSelectedNode(roadmapNode);
    setDetailsPanelCollapsed(false); // Always open panel when clicking a node
  };

  // Modify the onNodeDragStopHandler to maintain tree structure
  const onNodeDragStopHandler = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (readOnly) return;
      const updatedNodes = rfNodes.map((n) =>
        n.id === node.id ? { ...n, position: node.position } : n
      );
      setRfNodes(updatedNodes);
    },
    [rfNodes, setRfNodes, readOnly]
  );

  // Sync local nodes state with parent component (old API)
  useEffect(() => {
    if (onUpdateNodes) {
      const updatedRoadmapNodes = mapReactFlowNodesToRoadmapNodes(rfNodes);
      onUpdateNodes(updatedRoadmapNodes);
    }
  }, [rfNodes, onUpdateNodes]);

  // Sync local edges state with parent component (old API)
  useEffect(() => {
    if (onUpdateEdges) {
      const updatedRoadmapEdges = mapReactFlowEdgesToRoadmapEdges(rfEdges);
      onUpdateEdges(updatedRoadmapEdges);
    }
  }, [rfEdges, onUpdateEdges]);

  // Sync with new API
  useEffect(() => {
    if (onNodesChange) {
      const updatedRoadmapNodes = mapReactFlowNodesToRoadmapNodes(rfNodes);
      onNodesChange(updatedRoadmapNodes);
    }
  }, [rfNodes, onNodesChange]);

  useEffect(() => {
    if (onEdgesChange) {
      const updatedRoadmapEdges = mapReactFlowEdgesToRoadmapEdges(rfEdges);
      onEdgesChange(updatedRoadmapEdges);
    }
  }, [rfEdges, onEdgesChange]);

  // Handle node update from NodeDetailsPanel
  const handleNodeUpdate = (updatedNode: RoadmapNode) => {
    if (readOnly) return;
    
    console.log("Updating node with title:", updatedNode.title);
    
    // Ensure the title is a string and clean it
    const title = typeof updatedNode.title === 'string' ? updatedNode.title : cleanTitle(String(updatedNode.title));
    
    setRfNodes((nds) =>
      nds.map((n) =>
        n.id === updatedNode.id
          ? {
              ...n,
              style: getNodeStyle(updatedNode.completed), // Update styling based on completed status
              data: {
                ...n.data,
                // Store the original title for easy access
                originalTitle: title,
                label: (
                  <div className="overflow-hidden">
                    <div className="font-semibold mb-1 truncate">{title}</div>
                    <div className="text-xs text-gray-500">{updatedNode.timeNeeded || 0}h</div>
                  </div>
                ),
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
    
    // Update the selected node with clean title to keep details panel in sync
    const fixedUpdatedNode = {
      ...updatedNode,
      title: title
    };
    
    setSelectedNode(fixedUpdatedNode);
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
          onNodesChange={onNodesChangeInternal}
          onEdgesChange={onEdgesChangeInternal}
          onConnect={onConnectHandler}
          onNodeDragStop={onNodeDragStopHandler}
          onNodeClick={onNodeClick}
          defaultEdgeOptions={{
            type: 'default',
            style: edgeStyle,
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#94a3b8',
            },
          }}
          fitView
          fitViewOptions={{
            padding: 0.3,
            minZoom: 0.4,
            maxZoom: 1.2,
          }}
          minZoom={0.2}
          maxZoom={1.5}
          attributionPosition="bottom-left"
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
        >
          <Controls className="bottom-4 right-4" />
          <Background />
          <Panel position="top-left" className="bg-[#141414] text-white p-2 rounded shadow-lg">
            <div className="text-sm">
              <p>Nodes: {rfNodes.length}</p>
              <p>Completed: {rfNodes.filter(n => n.data.completed).length}</p>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {selectedNode && !isMobile && !readOnly && (
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
                roadmapId={roadmapId}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile View */}
      {selectedNode && isMobile && !readOnly && (
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
                roadmapId={roadmapId}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
      {error && (
        <RoadmapError 
          error={error} 
          onRetry={() => {
            setError(null);
            // Add your retry logic here
          }} 
        />
      )}

      {/* Save Button */}
      {onSave && !readOnly && (
        <div className="absolute bottom-6 right-6">
          <SaveRoadmapDialog onSave={onSave} isSaving={isSaving} />
        </div>
      )}
    </div>
  );
};

export default RoadmapCanvas;
