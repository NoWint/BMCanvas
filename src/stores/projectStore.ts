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
      // First, try to get version info from Modrinth
      let enrichedInput = { ...input };
      if (input.modrinth_id) {
        try {
          const versions = await tauri.getModVersions(
            input.modrinth_id,
            project.mc_version,
            project.loader
          );
          if (versions.length > 0) {
            const version = versions[0];
            enrichedInput = {
              ...enrichedInput,
              version_id: version.id,
              version_number: version.version_number ?? null,
              changelog: version.changelog ?? null,
            };
          }
        } catch (e) {
          console.warn('Failed to fetch version info:', e);
        }

        // Also get full project details for more info
        try {
          const details = await tauri.getModDetails(input.modrinth_id);
          if (details) {
            enrichedInput = {
              ...enrichedInput,
              source_url: details.source_url ?? enrichedInput.source_url,
              license: details.license?.id ?? enrichedInput.license,
              homepage_url: details.license?.name ?? enrichedInput.homepage_url,
              supported_mc_versions: details.versions ?? enrichedInput.supported_mc_versions,
            };
          }
        } catch (e) {
          console.warn('Failed to fetch mod details:', e);
        }
      }

      const mod = await tauri.addModToProject(project.id, enrichedInput);
      if (mod.modrinth_id) {
        try {
          await tauri.fetchAndSaveDependencies(
            mod.modrinth_id,
            project.mc_version,
            project.loader,
            mod.id
          );
        } catch (e) {
          console.warn('Failed to fetch dependencies:', e);
        }
      }
      await get().loadMods();
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
