import { create } from 'zustand';
import type { Node, Edge } from 'reactflow';
import type { ModNodeData, ProjectMod, Dependency } from '../types';
import { resolveDependencies, getNodeType } from '../engine/dependencyResolver';
import { computeLayout } from '../engine/graphLayout';

interface GraphState {
  nodes: Node<ModNodeData>[];
  edges: Edge[];
  searchQuery: string;
  layoutDirection: 'LR' | 'TB';
  collapsedNodes: Set<string>;
  highlightedNodeIds: Set<string>;
  pinnedPositions: Map<string, { x: number; y: number }>;
  contextMenu: { nodeId: string; x: number; y: number } | null;

  // Stored last build params for rebuild on collapse toggle
  _lastBuildParams: { mods: ProjectMod[]; deps: Dependency[]; loader: string } | null;

  buildGraph: (mods: ProjectMod[], deps: Dependency[], loader: string) => void;
  setSearchQuery: (query: string) => void;
  focusNode: (nodeId: string, reactFlowInstance?: any) => void;
  setLayoutDirection: (dir: 'LR' | 'TB') => void;
  toggleCollapse: (nodeId: string) => void;
  setHighlighted: (nodeIds: Set<string>) => void;
  clearHighlighted: () => void;
  updatePinnedPosition: (nodeId: string, position: { x: number; y: number }) => void;
  resetLayout: () => void;
  setContextMenu: (menu: { nodeId: string; x: number; y: number } | null) => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  searchQuery: '',
  layoutDirection: 'LR',
  collapsedNodes: new Set<string>(),
  highlightedNodeIds: new Set<string>(),
  pinnedPositions: new Map<string, { x: number; y: number }>(),
  contextMenu: null,
  _lastBuildParams: null,

  buildGraph: (mods, deps, loader) => {
    const { collapsedNodes, pinnedPositions } = get();

    // Store last build params
    set({ _lastBuildParams: { mods, deps, loader } });

    const loaderNode: Node<ModNodeData> = {
      id: 'loader-node',
      type: 'modNode',
      position: { x: 0, y: 0 },
      data: {
        modId: 'loader',
        name: loader.charAt(0).toUpperCase() + loader.slice(1),
        version: null,
        loader,
        iconUrl: null,
        nodeType: 'loader',
        dependencyCount: 0,
        collapsed: false,
        hasConflict: false,
        description: null,
        author: null,
        license: null,
        supportedMcVersions: [],
        homepageUrl: null,
        sourceUrl: null,
        changelog: null,
      },
    };

    // Determine which nodes are collapsed to filter downstream
    const collapsedSet = collapsedNodes;

    const modNodes: Node<ModNodeData>[] = mods.map((mod) => {
      const nodeType = getNodeType(mod);
      const modDeps = deps.filter((d) => d.project_mod_id === mod.id && d.dep_type === 'required');
      const hasConflict = deps.some(
        (d) => d.project_mod_id === mod.id && d.dep_type === 'incompatible'
      );
      const isCollapsed = collapsedSet.has(mod.id);

      // Count downstream deps if collapsed
      let collapsedDepCount: number | undefined;
      if (isCollapsed) {
        // Count how many nodes depend on this mod (downstream)
        const downstreamIds = new Set<string>();
        const queue = [mod.id];
        while (queue.length > 0) {
          const current = queue.shift()!;
          for (const dep of deps) {
            if (dep.project_mod_id === current) {
              const targetSlug = dep.depends_on_slug.toLowerCase();
              const targetMod = mods.find(
                (m) => m.slug?.toLowerCase() === targetSlug || m.id === dep.dep_modrinth_id
              );
              if (targetMod && !downstreamIds.has(targetMod.id) && targetMod.id !== mod.id) {
                downstreamIds.add(targetMod.id);
                queue.push(targetMod.id);
              }
            }
          }
        }
        collapsedDepCount = downstreamIds.size;
      }

      return {
        id: mod.id,
        type: 'modNode',
        position: { x: 0, y: 0 },
        data: {
          modId: mod.id,
          name: mod.name,
          version: mod.version_number,
          loader: null,
          iconUrl: mod.icon_url,
          nodeType,
          dependencyCount: modDeps.length,
          collapsed: isCollapsed,
          collapsedDepCount,
          hasConflict,
          description: mod.description,
          author: mod.author,
          license: mod.license,
          supportedMcVersions: mod.supported_mc_versions ?? [],
          homepageUrl: mod.homepage_url,
          sourceUrl: mod.source_url,
          changelog: mod.changelog,
        },
      };
    });

    // Filter out downstream nodes of collapsed nodes
    const collapsedDownstreamIds = new Set<string>();
    for (const collapsedId of collapsedSet) {
      const queue = [collapsedId];
      while (queue.length > 0) {
        const current = queue.shift()!;
        for (const dep of deps) {
          if (dep.project_mod_id === current) {
            const targetSlug = dep.depends_on_slug.toLowerCase();
            const targetMod = mods.find(
              (m) => m.slug?.toLowerCase() === targetSlug || m.id === dep.dep_modrinth_id
            );
            if (targetMod && !collapsedDownstreamIds.has(targetMod.id) && !collapsedSet.has(targetMod.id)) {
              collapsedDownstreamIds.add(targetMod.id);
              queue.push(targetMod.id);
            }
          }
        }
      }
    }

    const visibleModNodes = modNodes.filter((n) => !collapsedDownstreamIds.has(n.id));
    const allNodes = [loaderNode, ...visibleModNodes];

    const resolved = resolveDependencies(mods, deps);
    const edges: Edge[] = resolved
      .filter((r) => r.resolved && r.resolvedModId)
      .filter((r) => !collapsedDownstreamIds.has(r.resolvedModId!))
      .map((r) => ({
        id: `edge-${r.fromModId}-${r.resolvedModId}`,
        source: r.fromModId,
        target: r.resolvedModId!,
        type: r.depType === 'incompatible' ? 'conflictEdge' : r.depType === 'optional' ? 'optionalEdge' : 'requiredEdge',
        animated: r.depType === 'required',
        data: { depType: r.depType },
      }));

    for (const mod of mods) {
      if (collapsedDownstreamIds.has(mod.id)) continue;
      const nodeType = getNodeType(mod);
      if (nodeType !== 'loader') {
        edges.push({
          id: `edge-${mod.id}-loader`,
          source: mod.id,
          target: 'loader-node',
          type: 'optionalEdge',
          data: { depType: 'optional' },
        });
      }
    }

    const laidOutNodes = computeLayout(allNodes, edges, get().layoutDirection);

    // Apply pinned positions
    const finalNodes = laidOutNodes.map((node) => {
      const pinned = pinnedPositions.get(node.id);
      if (pinned) {
        return { ...node, position: pinned };
      }
      return node;
    });

    set({ nodes: finalNodes, edges });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  focusNode: (nodeId, reactFlowInstance) => {
    if (reactFlowInstance) {
      const node = get().nodes.find((n) => n.id === nodeId);
      if (node) {
        reactFlowInstance.setCenter(node.position.x + 110, node.position.y + 40, {
          zoom: 1.2,
          duration: 300,
        });
      }
    }
  },

  setLayoutDirection: (dir) => {
    set({ layoutDirection: dir });
  },

  toggleCollapse: (nodeId) => {
    const { collapsedNodes, _lastBuildParams } = get();
    const newCollapsed = new Set(collapsedNodes);
    if (newCollapsed.has(nodeId)) {
      newCollapsed.delete(nodeId);
    } else {
      newCollapsed.add(nodeId);
    }
    set({ collapsedNodes: newCollapsed });
    if (_lastBuildParams) {
      get().buildGraph(_lastBuildParams.mods, _lastBuildParams.deps, _lastBuildParams.loader);
    }
  },

  setHighlighted: (nodeIds) => set({ highlightedNodeIds: nodeIds }),

  clearHighlighted: () => set({ highlightedNodeIds: new Set<string>() }),

  updatePinnedPosition: (nodeId, position) => {
    const { pinnedPositions } = get();
    const newPinned = new Map(pinnedPositions);
    newPinned.set(nodeId, position);
    set({ pinnedPositions: newPinned });
  },

  resetLayout: () => {
    const { _lastBuildParams } = get();
    set({
      pinnedPositions: new Map<string, { x: number; y: number }>(),
      collapsedNodes: new Set<string>(),
    });
    if (_lastBuildParams) {
      get().buildGraph(_lastBuildParams.mods, _lastBuildParams.deps, _lastBuildParams.loader);
    }
  },

  setContextMenu: (menu) => set({ contextMenu: menu }),
}));
