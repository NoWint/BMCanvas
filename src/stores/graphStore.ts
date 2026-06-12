import { create } from 'zustand';
import type { Node, Edge } from 'reactflow';

interface GraphState {
  nodes: Node[];
  edges: Edge[];
  searchQuery: string;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSearchQuery: (query: string) => void;
  focusNode: (nodeId: string) => void;
  toggleCollapse: (nodeId: string) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  edges: [],
  searchQuery: '',

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  focusNode: (nodeId) => {
    console.log('Focus node:', nodeId);
  },

  toggleCollapse: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, collapsed: !node.data.collapsed } }
          : node
      ),
    }));
  },
}));
