import { create } from 'zustand';
import type { ViewType } from '../types';

interface UiState {
  activeView: ViewType;
  inspectorOpen: boolean;
  selectedNodeId: string | null;

  setActiveView: (view: ViewType) => void;
  setInspectorOpen: (open: boolean) => void;
  setSelectedNodeId: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeView: 'projects',
  inspectorOpen: false,
  selectedNodeId: null,

  setActiveView: (view) => set({ activeView: view }),
  setInspectorOpen: (open) => set({ inspectorOpen: open }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id, inspectorOpen: id !== null }),
}));
