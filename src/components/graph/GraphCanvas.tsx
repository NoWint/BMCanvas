import { useCallback, useEffect, useRef } from 'react';
import ReactFlow, { Background, MiniMap, type OnNodeClick, type ReactFlowInstance } from 'reactflow';
import 'reactflow/dist/style.css';
import { useProjectStore } from '../../stores/projectStore';
import { useGraphStore } from '../../stores/graphStore';
import { useUIStore } from '../../stores/uiStore';
import { ModNode } from './ModNode';
import { RequiredEdgeComponent, OptionalEdgeComponent, ConflictEdgeComponent } from './DependencyEdge';
import { GraphControls } from './GraphControls';
import { detectConflicts } from '../../engine/conflictDetector';
import * as tauri from '../../lib/tauri';

const nodeTypes = { modNode: ModNode };
const edgeTypes = {
  requiredEdge: RequiredEdgeComponent,
  optionalEdge: OptionalEdgeComponent,
  conflictEdge: ConflictEdgeComponent,
};

export function GraphCanvas() {
  const { mods, currentProject } = useProjectStore();
  const { nodes, edges, buildGraph } = useGraphStore();
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
    openInspector(node.id);
  }, [setSelectedNode, openInspector]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    rfInstance.current = instance;
    setTimeout(() => instance.fitView({ padding: 0.2, duration: 300 }), 100);
  }, []);

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D0D0F]">
        <div className="text-center">
          <div className="text-[#3F3F46] text-lg mb-2">No project selected</div>
          <div className="text-[#27272A] text-sm">Create or select a project to begin</div>
        </div>
      </div>
    );
  }

  if (mods.length === 0) {
    return (
      <div className="flex-1 relative bg-[#0D0D0F]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[#3F3F46] text-lg mb-1">Empty pack</div>
            <div className="text-[#27272A] text-sm">
              Press <kbd className="px-1.5 py-0.5 bg-[#18181B] border border-[#27272A] rounded text-[#71717A] text-xs font-mono">⌘K</kbd> to add your first mod
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-[#0D0D0F]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
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
            const colors: Record<string, string> = { mod: '#D4A017', library: '#3B82F6', api: '#8B5CF6', loader: '#22C55E' };
            return colors[data?.nodeType ?? 'mod'] ?? '#52525B';
          }}
          maskColor="#09090B99"
          style={{ background: '#111113' }}
        />
      </ReactFlow>
      <GraphControls />
      <DiagnosticsBadge />
    </div>
  );
}

function DiagnosticsBadge() {
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
      {critical > 0 && <span className="text-[#EF4444]">⚠ {critical} Critical</span>}
      {warning > 0 && <span className="text-[#F59E0B]">{critical > 0 ? ' · ' : ''}{warning} Warning</span>}
    </div>
  );
}
