// Detect if running inside Tauri webview
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// Lazy-loaded real invoke (only available in Tauri webview)
let realInvoke: typeof import('@tauri-apps/api/core').invoke | null = null;

async function getInvoke() {
  if (realInvoke) return realInvoke;
  if (isTauri) {
    const mod = await import('@tauri-apps/api/core');
    realInvoke = mod.invoke;
    return realInvoke;
  }
  return null;
}

// In-memory mock store for browser/dev mode
const mockProjects: Map<string, any> = new Map();
const mockMods: Map<string, any[]> = new Map();
const mockDeps: Map<string, any[]> = new Map();
let mockIdCounter = 1;

function mockInvoke(cmd: string, args: any): Promise<any> {
  switch (cmd) {
    case 'create_project': {
      const input = args.input;
      const id = `mock-${mockIdCounter++}`;
      const now = Date.now();
      const project = {
        id,
        name: input.name,
        description: input.description || '',
        mc_version: input.mc_version,
        loader: input.loader,
        author: input.author || '',
        tags: JSON.stringify(input.tags || []),
        created_at: now,
        updated_at: now,
      };
      mockProjects.set(id, project);
      mockMods.set(id, []);
      return Promise.resolve(project);
    }
    case 'list_projects':
      return Promise.resolve(Array.from(mockProjects.values()));
    case 'get_project':
      return Promise.resolve(mockProjects.get(args.id) || null);
    case 'delete_project': {
      mockProjects.delete(args.id);
      mockMods.delete(args.id);
      return Promise.resolve();
    }
    case 'add_mod_to_project': {
      const projectId = args.projectId;
      const input = args.input;
      const modId = `mod-${mockIdCounter++}`;
      const mod = {
        id: modId,
        project_id: projectId,
        modrinth_id: input.modrinth_id || null,
        slug: input.slug || null,
        name: input.name,
        version_id: input.version_id || null,
        version_number: input.version_number || null,
        icon_url: input.icon_url || null,
        description: input.description || null,
        author: input.author || null,
        source_url: input.source_url || null,
        license: input.license || null,
      };
      const mods = mockMods.get(projectId) || [];
      mods.push(mod);
      mockMods.set(projectId, mods);
      return Promise.resolve(mod);
    }
    case 'remove_mod_from_project': {
      const mods = mockMods.get(args.projectId) || [];
      mockMods.set(args.projectId, mods.filter((m: any) => m.id !== args.modId));
      return Promise.resolve();
    }
    case 'list_project_mods':
      return Promise.resolve(mockMods.get(args.projectId) || []);
    case 'save_dependencies':
      return Promise.resolve();
    case 'get_dependencies':
      return Promise.resolve(mockDeps.get(args.modId) || []);
    case 'fetch_and_save_dependencies': {
      const modrinthId = args.modrinthId as string;
      const projectModId = args.projectModId as string;
      const mockDepMap: Record<string, Array<{id: string; project_mod_id: string; depends_on_slug: string; dep_type: string; dep_modrinth_id: string | null}>> = {
        'mock-create': [
          { id: 'dep-1', project_mod_id: projectModId, depends_on_slug: 'flywheel', dep_type: 'required', dep_modrinth_id: 'mock-flywheel' },
          { id: 'dep-2', project_mod_id: projectModId, depends_on_slug: 'registrate', dep_type: 'required', dep_modrinth_id: 'mock-registrate' },
        ],
        'mock-sodium': [
          { id: 'dep-3', project_mod_id: projectModId, depends_on_slug: 'fabric-api', dep_type: 'required', dep_modrinth_id: 'mock-fabric-api' },
        ],
        'mock-iris': [
          { id: 'dep-4', project_mod_id: projectModId, depends_on_slug: 'sodium', dep_type: 'required', dep_modrinth_id: 'mock-sodium' },
        ],
      };
      const deps = mockDepMap[modrinthId] || [];
      // Store deps for get_all_dependencies
      const allDeps = mockDeps.get(args.projectId as string) || [];
      allDeps.push(...deps);
      mockDeps.set(args.projectId as string, allDeps);
      return Promise.resolve(deps);
    }
    case 'get_all_dependencies': {
      const allStored = mockDeps.get(args.projectId as string) || [];
      return Promise.resolve(allStored);
    }
    case 'search_mods': {
      // Return mock search results
      return Promise.resolve({
        hits: [
          {
            project_id: 'mock-sodium',
            slug: 'sodium',
            title: 'Sodium',
            description: 'Modern rendering engine for Minecraft',
            author: 'jellysquid3',
            icon_url: null,
            downloads: 15000000,
            loaders: ['fabric', 'neoforge'],
            game_versions: ['1.21.1', '1.20.4'],
          },
          {
            project_id: 'mock-iris',
            slug: 'iris',
            title: 'Iris Shaders',
            description: 'Shader loader for Sodium',
            author: 'coderbot',
            icon_url: null,
            downloads: 8000000,
            loaders: ['fabric'],
            game_versions: ['1.21.1'],
          },
          {
            project_id: 'mock-create',
            slug: 'create',
            title: 'Create',
            description: 'Technology and automation mod',
            author: 'simibubi',
            icon_url: null,
            downloads: 25000000,
            loaders: ['forge', 'neoforge', 'fabric'],
            game_versions: ['1.21.1', '1.20.1'],
          },
        ],
        total_hits: 3,
        offset: 0,
        limit: 10,
      });
    }
    case 'get_mod_details':
      return Promise.resolve(null);
    case 'get_mod_versions':
      return Promise.resolve([]);
    case 'export_pack':
      return Promise.resolve('Mock export completed');
    default:
      return Promise.reject(new Error(`Unknown command: ${cmd}`));
  }
}

async function callInvoke(cmd: string, args: any): Promise<any> {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke(cmd, args);
  }
  return mockInvoke(cmd, args);
}

import type {
  Project, ProjectInput, ProjectMod, ModInput,
  Dependency, DepInput,
  ModrinthSearchResult, ModrinthVersion,
} from '../types';

// Project commands
export const createProject = (input: ProjectInput): Promise<Project> =>
  callInvoke('create_project', { input });

export const listProjects = (): Promise<Project[]> =>
  callInvoke('list_projects', {});

export const getProject = (id: string): Promise<Project> =>
  callInvoke('get_project', { id });

export const deleteProject = (id: string): Promise<void> =>
  callInvoke('delete_project', { id });

// Mod commands
export const addModToProject = (projectId: string, input: ModInput): Promise<ProjectMod> =>
  callInvoke('add_mod_to_project', { projectId, input });

export const removeModFromProject = (projectId: string, modId: string): Promise<void> =>
  callInvoke('remove_mod_from_project', { projectId, modId });

export const listProjectMods = (projectId: string): Promise<ProjectMod[]> =>
  callInvoke('list_project_mods', { projectId });

// Dependency commands
export const saveDependencies = (modId: string, deps: DepInput[]): Promise<void> =>
  callInvoke('save_dependencies', { modId, deps });

export const getDependencies = (modId: string): Promise<Dependency[]> =>
  callInvoke('get_dependencies', { modId });

export const getAllDependencies = (projectId: string): Promise<Dependency[]> =>
  callInvoke('get_all_dependencies', { projectId });

// Search commands
interface SearchFilters {
  loaders?: string[];
  game_versions?: string[];
}

export const searchMods = (query: string, filters?: SearchFilters, limit?: number, offset?: number): Promise<ModrinthSearchResult> =>
  callInvoke('search_mods', { query, filters, limit, offset });

export const getModDetails = (modrinthId: string): Promise<any> =>
  callInvoke('get_mod_details', { modrinthId });

export const getModVersions = (modrinthId: string, mcVersion?: string, loader?: string): Promise<ModrinthVersion[]> =>
  callInvoke('get_mod_versions', { modrinthId, mcVersion, loader });

// Fetch and save dependencies automatically
export const fetchAndSaveDependencies = (
  modrinthId: string,
  mcVersion: string,
  loader: string,
  projectModId: string
): Promise<Dependency[]> =>
  callInvoke('fetch_and_save_dependencies', { modrinthId, mcVersion, loader, projectModId });
