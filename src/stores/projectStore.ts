import { create } from 'zustand';
import type { Project, ProjectMod, ProjectInput, ModInput } from '../types';
import * as tauri from '../lib/tauri';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  mods: ProjectMod[];
  loading: boolean;
  error: string | null;

  loadProjects: () => Promise<void>;
  createProject: (input: ProjectInput) => Promise<Project>;
  selectProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addMod: (input: ModInput) => Promise<void>;
  removeMod: (modId: string) => Promise<void>;
  loadMods: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  mods: [],
  loading: false,
  error: null,

  loadProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await tauri.listProjects();
      set({ projects, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  createProject: async (input) => {
    set({ loading: true, error: null });
    try {
      const project = await tauri.createProject(input);
      set((state) => ({ projects: [project, ...state.projects], loading: false }));
      return project;
    } catch (e) {
      set({ error: String(e), loading: false });
      throw e;
    }
  },

  selectProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const project = await tauri.getProject(id);
      const mods = await tauri.listProjectMods(id);
      set({ currentProject: project, mods, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  deleteProject: async (id) => {
    try {
      await tauri.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        mods: state.currentProject?.id === id ? [] : state.mods,
      }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  addMod: async (input) => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const mod = await tauri.addModToProject(project.id, input);
      set((state) => ({ mods: [...state.mods, mod] }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  removeMod: async (modId) => {
    const project = get().currentProject;
    if (!project) return;
    try {
      await tauri.removeModFromProject(project.id, modId);
      set((state) => ({ mods: state.mods.filter((m) => m.id !== modId) }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  loadMods: async () => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const mods = await tauri.listProjectMods(project.id);
      set({ mods });
    } catch (e) {
      set({ error: String(e) });
    }
  },
}));
