import { useCallback, useEffect, useRef } from 'react';
import ReactFlow, { Background, MiniMap, type OnNodeClick, type ReactFlowInstance } from 'reactflow';
import 'reactflow/dist/style.css';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../stores/projectStore';
import { useGraphStore } from '../../stores/graphStore';
import { useUIStore } from '../../stores/uiStore';
import { ModNode } from './ModNode';
import { RequiredEdgeComponent, OptionalEdgeComponent, ConflictEdgeComponent } from './DependencyEdge';
import { GraphControls } from './GraphControls';
import { ContextMenu } from './ContextMenu';
import { detectConflicts } from '../../engine/conflictDetector';
import * as tauri from '../../lib/tauri';

const nodeTypes = { modNode: ModNode };
const edgeTypes = {
  requiredEdge: RequiredEdgeComponent,
  optionalEdge: OptionalEdgeComponent,
  conflictEdge: ConflictEdgeComponent,
};

export function GraphCanvas() {
  const { t } = useTranslation();
  const { mods, currentProject } = useProjectStore();
  const { nodes, edges, buildGraph, toggleCollapse, setHighlighted, clearHighlighted, updatePinnedPosition, setContextMenu, contextMenu, highlightedNodeIds } = useGraphStore();
  const { openInspector, setSelectedNode } = useUIStore();
  const rfInstance = useRef<ReactFlowInstance | null>(null);

  useEffect(() => {
    if (!currentProject) return;
    const loadAndBuild = async () => {
      const deps = await tauri.getAllDependencies(currentProject.id);
      buildGraph(mods, deps, currentProject.loader);
    };
    loadAndBuild();
  }, [mods, currentProject, buildGraph]);

  const onNodeClick: OnNodeClick = useCallback((_event, node) => {
    if (node.id === 'loader-node') return;
    setSelectedNode(node.id);

    // If clicking the same node that's highlighted, clear highlight
    if (highlightedNodeIds.size > 0 && highlightedNodeIds.has(node.id) && highlightedNodeIds.size === 1) {
      clearHighlighted();
    } else {
      // Compute path from this node to root (trace upstream edges)
      const { edges: currentEdges } = useGraphStore.getState();
      const pathNodeIds = new Set<string>();
      pathNodeIds.add(node.id);

      let current = new Set([node.id]);
      while (current.size > 0) {
        const next = new Set<string>();
        for (const edge of currentEdges) {
          if (current.has(edge.target) && !pathNodeIds.has(edge.source)) {
            pathNodeIds.add(edge.source);
            next.add(edge.source);
          }
        }
        current = next;
      }

      setHighlighted(pathNodeIds);
    }

    openInspector(node.id);
  }, [setSelectedNode, openInspector, setHighlighted, clearHighlighted, highlightedNodeIds]);

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: any) => {
    if (node.id === 'loader-node') return;
    toggleCollapse(node.id);
  }, [toggleCollapse]);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: any) => {
    event.preventDefault();
    if (node.id === 'loader-node') return;
    setContextMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
  }, [setContextMenu]);

  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: any) => {
    updatePinnedPosition(node.id, { x: node.position.x, y: node.position.y });
  }, [updatePinnedPosition]);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
    clearHighlighted();
  }, [setContextMenu, clearHighlighted]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    rfInstance.current = instance;
    setTimeout(() => instance.fitView({ padding: 0.2, duration: 300 }), 100);
  }, []);

  // Apply dimmed class to nodes/edges not in highlightedNodeIds
  const hasHighlight = highlightedNodeIds.size > 0;
  const displayNodes = hasHighlight
    ? nodes.map((n) => ({
        ...n,
        className: highlightedNodeIds.has(n.id) ? '' : 'dimmed',
      }))
    : nodes;

  const displayEdges = hasHighlight
    ? edges.map((e) => ({
        ...e,
        className: highlightedNodeIds.has(e.source) && highlightedNodeIds.has(e.target) ? '' : 'dimmed',
      }))
    : edges;

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D0D0F]">
        <div className="text-center">
          <div className="text-[#3F3F46] text-lg mb-2">{t('graph.noProject')}</div>
          <div className="text-[#27272A] text-sm">{t('graph.createOrSelect')}</div>
        </div>
      </div>
    );
  }

  if (mods.length === 0) {
    return (
      <div className="flex-1 relative bg-[#0D0D0F]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[#3F3F46] text-lg mb-1">{t('graph.emptyPack')}</div>
            <div className="text-[#27272A] text-sm">
              {t('graph.addFirstMod')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-[#0D0D0F]">
      <style>{`
        .dimmed { opacity: 0.2; transition: opacity 0.3s ease; }
        .react-flow__node:not(.dimmed) { transition: opacity 0.3s ease; }
        .react-flow__edge:not(.dimmed) { transition: opacity 0.3s ease; }
      `}</style>
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="!bg-[#0D0D0F]"
      >
        <Background color="#1E1E22" gap={24} size={1} />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as any;
            const colors: Record<string, string> = { mod: '#ff9f0a', library: '#0a84ff', api: '#bf5af2', loader: '#30d158' };
            return colors[data?.nodeType ?? 'mod'] ?? '#52525B';
          }}
          maskColor="#09090B99"
          style={{ background: '#111113' }}
        />
      </ReactFlow>
      <GraphControls />
      <DiagnosticsBadge />
      {contextMenu && (
        <ContextMenu nodeId={contextMenu.nodeId} x={contextMenu.x} y={contextMenu.y} />
      )}
    </div>
  );
}

function DiagnosticsBadge() {
  const { t } = useTranslation();
  const { mods, currentProject } = useProjectStore();
  const { togglePanel } = useUIStore();

  if (!currentProject || mods.length === 0) return null;

  const diagnostics = detectConflicts(mods, [], currentProject.mc_version, currentProject.loader);
  const critical = diagnostics.filter((d) => d.severity === 'critical').length;
  const warning = diagnostics.filter((d) => d.severity === 'warning').length;

  if (critical === 0 && warning === 0) return null;

  return (
    <div
      className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#18181B]/80 border border-[#27272A] backdrop-blur-sm text-[9px] font-mono cursor-pointer hover:border-[#3F3F46] transition-colors duration-100 z-10"
      onClick={() => togglePanel('diagnostics')}
    >
      {critical > 0 && <span className="text-[#EF4444]">⚠ {critical} {t('diagnostics.critical')}</span>}
      {warning > 0 && <span className="text-[#F59E0B]">{critical > 0 ? ' · ' : ''}{warning} {t('diagnostics.warning')}</span>}
    </div>
  );
}
