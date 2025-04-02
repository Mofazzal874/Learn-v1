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
  Position,
  MarkerType,
  ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import { RoadmapNode, RoadmapEdge } from "../types";
import NodeDetailsPanel from "./NodeDetailsPanel";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import RoadmapError from './RoadmapError';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
    sequence: 0,
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

const nodeStyle = {
  padding: '8px',
  borderRadius: '8px',
  border: '2px solid #e2e8f0',
  background: 'white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  width: 140,
  fontSize: '11px',
  textAlign: 'center' as const,
};

const edgeStyle = {
  stroke: '#94a3b8',
  strokeWidth: 2,
};

// Update the constants for better spacing
const NODE_WIDTH = 140;
const NODE_HEIGHT = 80;
const MIN_HORIZONTAL_SPACING = 200; // Increased from 50 to 200
const VERTICAL_SPACING = 150;

// Add new helper functions for better overlap handling
const getNodeBounds = (node: Node) => {
  return {
    left: node.position.x - NODE_WIDTH / 2,
    right: node.position.x + NODE_WIDTH / 2,
    top: node.position.y,
    bottom: node.position.y + NODE_HEIGHT,
  };
};

const doNodesOverlap = (node1: Node, node2: Node): boolean => {
  const bounds1 = getNodeBounds(node1);
  const bounds2 = getNodeBounds(node2);

  return !(
    bounds1.right + MIN_HORIZONTAL_SPACING < bounds2.left ||
    bounds1.left > bounds2.right + MIN_HORIZONTAL_SPACING ||
    bounds1.bottom + VERTICAL_SPACING < bounds2.top ||
    bounds1.top > bounds2.bottom + VERTICAL_SPACING
  );
};

const shiftNodeAndSubtree = (
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  shiftX: number,
  visited: Set<string> = new Set()
): void => {
  if (visited.has(nodeId)) return;
  visited.add(nodeId);

  // Shift the current node
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return;

  node.position.x += shiftX;

  // Recursively shift all children
  const childEdges = edges.filter(e => e.source === nodeId);
  childEdges.forEach(edge => {
    shiftNodeAndSubtree(edge.target, nodes, edges, shiftX, visited);
  });
};

const resolveOverlaps = (nodes: Node[], edges: Edge[]): void => {
  const nodesByLevel = new Map<number, Node[]>();
  
  // Group nodes by their vertical level
  nodes.forEach(node => {
    const level = Math.floor(node.position.y / VERTICAL_SPACING);
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  });

  // Process each level
  nodesByLevel.forEach((levelNodes) => {
    // Sort nodes by x position
    levelNodes.sort((a, b) => a.position.x - b.position.x);

    // Check and resolve overlaps between adjacent nodes
    for (let i = 0; i < levelNodes.length - 1; i++) {
      const currentNode = levelNodes[i];
      const nextNode = levelNodes[i + 1];

      if (doNodesOverlap(currentNode, nextNode)) {
        // Calculate required shift
        const currentBounds = getNodeBounds(currentNode);
        const nextBounds = getNodeBounds(nextNode);
        const overlap = currentBounds.right + MIN_HORIZONTAL_SPACING - nextBounds.left;
        
        // Shift the next node and its subtree
        shiftNodeAndSubtree(nextNode.id, nodes, edges, overlap + MIN_HORIZONTAL_SPACING, new Set());
      }
    }
  });
};

const calculateTreeLayout = (nodes: Node[], edges: Edge[], startY: number = 0): Node[] => {
  // Create a map of node IDs to their children
  const nodeMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();
  
  // Initialize maps
  nodes.forEach(node => {
    nodeMap.set(node.id, []);
  });
  
  // Build relationships
  edges.forEach(edge => {
    const children = nodeMap.get(edge.source) || [];
    children.push(edge.target);
    nodeMap.set(edge.source, children);
    parentMap.set(edge.target, edge.source);
  });
  
  // Find root nodes (nodes with no parents)
  const rootNodes = nodes.filter(node => !parentMap.has(node.id));
  
  // Initial spacing between root nodes
  const ROOT_SPACING = NODE_WIDTH * 2;
  
  // Process each root node and its subtree
  const processNode = (nodeId: string, x: number, y: number, level: number = 0): void => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Position current node
    node.position = { x, y };
    
    // Process children
    const children = nodeMap.get(nodeId) || [];
    if (children.length > 0) {
      const totalChildrenWidth = (children.length - 1) * MIN_HORIZONTAL_SPACING;
      let startX = x - totalChildrenWidth / 2;
      
      children.forEach((childId, index) => {
        processNode(
          childId,
          startX + index * MIN_HORIZONTAL_SPACING,
          y + VERTICAL_SPACING,
          level + 1
        );
      });
    }
  };
  
  // Initial positioning
  rootNodes.forEach((rootNode, index) => {
    processNode(rootNode.id, index * ROOT_SPACING, startY);
  });

  // Post-process to resolve any remaining overlaps
  resolveOverlaps(nodes, edges);
  
  return nodes;
};

// Add this function near the top with other utility functions
const generateUniqueId = (): string => {
  return `edge_${Math.random().toString(36).substr(2, 9)}`;
};

const RoadmapCanvas: React.FC<RoadmapCanvasProps> = ({
  nodes,
  edges,
  onUpdateNodes,
  onUpdateEdges,
  isFormCollapsed = false,
}) => {
  const initialRfNodes = mapRoadmapNodesToReactFlowNodes(nodes).map(node => ({
    ...node,
    style: nodeStyle,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    data: {
      ...node.data,
      label: (
        <div className="overflow-hidden">
          <div className="font-semibold mb-1 truncate">{node.data.label}</div>
          <div className="text-xs text-gray-500">{node.data.timeNeeded}h</div>
        </div>
      ),
    },
  }));
  const initialRfEdges = mapRoadmapEdgesToReactFlowEdges(edges);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(initialRfNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(initialRfEdges);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [isDetailsPanelCollapsed, setDetailsPanelCollapsed] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [error, setError] = useState<string | null>(null);

  // Handle connection (edge creation)
  const onConnectHandler: OnConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      // Check if target node already has a parent
      const targetHasParent = rfEdges.some(edge => edge.target === params.target);
      
      if (targetHasParent) {
        toast.error("A node can only have one parent");
        return;
      }

      // Check for circular connections
      const wouldCreateCycle = (source: string, target: string): boolean => {
        const visited = new Set<string>();
        const dfs = (current: string): boolean => {
          if (current === target) return true;
          visited.add(current);
          
          const children = rfEdges
            .filter(edge => edge.source === current)
            .map(edge => edge.target);
          
          return children.some(child => 
            !visited.has(child) && dfs(child)
          );
        };
        
        return dfs(target);
      };

      if (wouldCreateCycle(params.source, params.target)) {
        toast.error("Cannot create circular dependencies");
        return;
      }

      const newEdge: Edge = {
        id: generateUniqueId(),
        source: params.source,
        target: params.target,
        animated: true,
      };

      setRfEdges((eds) => addEdge(newEdge, eds));
      
      // Recalculate layout after adding new edge
      const updatedNodes = calculateTreeLayout(rfNodes, [...rfEdges, newEdge]);
      setRfNodes([...updatedNodes]);
    },
    [rfEdges, rfNodes, setRfEdges, setRfNodes]
  );

  // Handle node click
  const onNodeClick = (_: React.MouseEvent, node: Node<any, any>) => {
    const roadmapNode = nodes.find((n) => n.id === node.id);
    if (roadmapNode) {
      setSelectedNode(roadmapNode);
      setDetailsPanelCollapsed(false); // Always open panel when clicking a node
    }
  };

  // Modify the onNodeDragStopHandler to maintain tree structure
  const onNodeDragStopHandler = useCallback(
    (event: React.MouseEvent, node: Node<any, any>) => {
      // Find the parent node
      const parentEdge = rfEdges.find(edge => edge.target === node.id);
      if (parentEdge) {
        const parentNode = rfNodes.find(n => n.id === parentEdge.source);
        if (parentNode) {
          // Calculate new position relative to parent
          const newPosition = {
            x: node.position.x,
            y: Math.max(parentNode.position.y + 150, node.position.y), // Ensure node stays below parent
          };
          
          const updatedNodes = rfNodes.map((n) =>
            n.id === node.id ? { ...n, position: newPosition } : n
          );
          setRfNodes(updatedNodes);
        }
      }
    },
    [rfNodes, rfEdges, setRfNodes]
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

  // Add this effect to apply tree layout when nodes or edges change
  useEffect(() => {
    const updatedNodes = calculateTreeLayout(rfNodes, rfEdges);
    setRfNodes(updatedNodes);
  }, [rfNodes.length, rfEdges.length]); // Only re-run when number of nodes/edges changes

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
          defaultEdgeOptions={{
            type: 'default',
            style: edgeStyle,
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
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
          connectOnClick={true}
          snapToGrid={true}
          snapGrid={[15, 15]}
          connectionMode={ConnectionMode.Strict}
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
      {error && (
        <RoadmapError 
          error={error} 
          onRetry={() => {
            setError(null);
            // Add your retry logic here
          }} 
        />
      )}
    </div>
  );
};

export default RoadmapCanvas;
