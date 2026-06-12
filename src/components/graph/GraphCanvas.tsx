import { useCallback, useEffect } from 'react';
import ReactFlow, { useNodesState, useEdgesState, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';

import { ModNode } from './ModNode';
import { DependencyEdge } from './DependencyEdge';
import { GraphControls } from './GraphControls';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore } from '../../stores/uiStore';
import { useGraphStore } from '../../stores/graphStore';
import { computeLayout } from '../../engine/graphLayout';
import { getNodeType } from '../../engine/dependencyResolver';
import type { ModNodeData } from '../../types';
import type { Node, Edge } from 'reactflow';

const NODE_TYPES = { modNode: ModNode };
const EDGE_TYPES = { dependency: DependencyEdge };

export function GraphCanvas() {
  const mods = useProjectStore((s) => s.mods);
  const currentProject = useProjectStore((s) => s.currentProject);
  const setSelectedNodeId = useUiStore((s) => s.setSelectedNodeId);
  const setInspectorOpen = useUiStore((s) => s.setInspectorOpen);
  const setGraphNodes = useGraphStore((s) => s.setNodes);
  const setGraphEdges = useGraphStore((s) => s.setEdges);
  const toggleCollapse = useGraphStore((s) => s.toggleCollapse);

  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!currentProject) return;

    const loaderNode: Node<ModNodeData> = {
      id: 'loader-node',
      type: 'modNode',
      position: { x: 0, y: 0 },
      data: {
        modId: 'loader',
        name: currentProject.loader.charAt(0).toUpperCase() + currentProject.loader.slice(1),
        version: currentProject.mc_version,
        loader: currentProject.loader,
        iconUrl: null,
        nodeType: 'loader',
        dependencyCount: 0,
        collapsed: false,
        hasConflict: false,
      },
    };

    const modNodes: Node<ModNodeData>[] = mods.map((mod) => ({
      id: mod.id,
      type: 'modNode',
      position: { x: 0, y: 0 },
      data: {
        modId: mod.id,
        name: mod.name,
        version: mod.version_number,
        loader: null,
        iconUrl: mod.icon_url,
        nodeType: getNodeType(mod),
        dependencyCount: 0,
        collapsed: false,
        hasConflict: false,
      },
    }));

    const allNodes = [loaderNode, ...modNodes];
    const layouted = computeLayout(allNodes, []);

    setNodes(layouted);
    setGraphNodes(layouted);
    setEdges([]);
    setGraphEdges([]);

    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [mods, currentProject, setNodes, setEdges, setGraphNodes, setGraphEdges, fitView]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id === 'loader-node') return;
      setSelectedNodeId(node.id);
      setInspectorOpen(true);
    },
    [setSelectedNodeId, setInspectorOpen]
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      toggleCollapse(node.id);
    },
    [toggleCollapse]
  );

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center text-text-tertiary">
        Select a project to view its dependency graph
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        fitView
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <GraphControls />
      </ReactFlow>
    </div>
  );
}
