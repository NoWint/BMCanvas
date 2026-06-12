import { create } from 'zustand';
import type { PanelType } from '../types';

interface UIState {
  activePanel: PanelType;
  inspectorOpen: boolean;
  selectedNodeId: string | null;
  welcomeVisible: boolean;

  openPanel: (panel: PanelType) => void;
  closePanel: () => void;
  togglePanel: (panel: PanelType) => void;
  openInspector: (nodeId: string) => void;
  closeInspector: () => void;
  setSelectedNode: (nodeId: string | null) => void;
  hideWelcome: () => void;
  showWelcome: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activePanel: null,
  inspectorOpen: false,
  selectedNodeId: null,
  welcomeVisible: true,

  openPanel: (panel) => set({ activePanel: panel }),
  closePanel: () => set({ activePanel: null }),
  togglePanel: (panel) => {
    const current = get().activePanel;
    set({ activePanel: current === panel ? null : panel });
  },
  openInspector: (nodeId) => set({ inspectorOpen: true, selectedNodeId: nodeId }),
  closeInspector: () => set({ inspectorOpen: false, selectedNodeId: null }),
  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),
  hideWelcome: () => set({ welcomeVisible: false }),
  showWelcome: () => set({ welcomeVisible: true }),
}));
