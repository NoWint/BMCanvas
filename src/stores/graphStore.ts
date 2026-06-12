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

  buildGraph: (mods: ProjectMod[], deps: Dependency[], loader: string) => void;
  setSearchQuery: (query: string) => void;
  focusNode: (nodeId: string, reactFlowInstance?: any) => void;
  setLayoutDirection: (dir: 'LR' | 'TB') => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  searchQuery: '',
  layoutDirection: 'LR',

  buildGraph: (mods, deps, loader) => {
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

    const modNodes: Node<ModNodeData>[] = mods.map((mod) => {
      const nodeType = getNodeType(mod);
      const modDeps = deps.filter((d) => d.project_mod_id === mod.id && d.dep_type === 'required');
      const hasConflict = deps.some(
        (d) => d.project_mod_id === mod.id && d.dep_type === 'incompatible'
      );

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
          collapsed: false,
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

    const allNodes = [loaderNode, ...modNodes];

    const resolved = resolveDependencies(mods, deps);
    const edges: Edge[] = resolved
      .filter((r) => r.resolved && r.resolvedModId)
      .map((r) => ({
        id: `edge-${r.fromModId}-${r.resolvedModId}`,
        source: r.fromModId,
        target: r.resolvedModId!,
        type: r.depType === 'incompatible' ? 'conflictEdge' : r.depType === 'optional' ? 'optionalEdge' : 'requiredEdge',
        animated: r.depType === 'required',
        data: { depType: r.depType },
      }));

    for (const mod of mods) {
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
    set({ nodes: laidOutNodes, edges });
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
}));
