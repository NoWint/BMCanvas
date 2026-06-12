import { invoke } from '@tauri-apps/api/core';
import type {
  Project, ProjectInput, ProjectMod, ModInput,
  Dependency, DepInput,
  ModrinthSearchResult, ModrinthVersion,
} from '../types';

// Project commands
export const createProject = (input: ProjectInput): Promise<Project> =>
  invoke('create_project', { input });

export const listProjects = (): Promise<Project[]> =>
  invoke('list_projects');

export const getProject = (id: string): Promise<Project> =>
  invoke('get_project', { id });

export const deleteProject = (id: string): Promise<void> =>
  invoke('delete_project', { id });

// Mod commands
export const addModToProject = (projectId: string, input: ModInput): Promise<ProjectMod> =>
  invoke('add_mod_to_project', { projectId, input });

export const removeModFromProject = (projectId: string, modId: string): Promise<void> =>
  invoke('remove_mod_from_project', { projectId, modId });

export const listProjectMods = (projectId: string): Promise<ProjectMod[]> =>
  invoke('list_project_mods', { projectId });

// Dependency commands
export const saveDependencies = (modId: string, deps: DepInput[]): Promise<void> =>
  invoke('save_dependencies', { modId, deps });

export const getDependencies = (modId: string): Promise<Dependency[]> =>
  invoke('get_dependencies', { modId });

export const getAllDependencies = (projectId: string): Promise<Dependency[]> =>
  invoke('get_all_dependencies', { projectId });

// Search commands
interface SearchFilters {
  loaders?: string[];
  game_versions?: string[];
}

export const searchMods = (query: string, filters?: SearchFilters, limit?: number, offset?: number): Promise<ModrinthSearchResult> =>
  invoke('search_mods', { query, filters, limit, offset });

export const getModDetails = (modrinthId: string): Promise<any> =>
  invoke('get_mod_details', { modrinthId });

export const getModVersions = (modrinthId: string, mcVersion?: string, loader?: string): Promise<ModrinthVersion[]> =>
  invoke('get_mod_versions', { modrinthId, mcVersion, loader });
