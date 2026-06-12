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
        homepage_url: input.homepage_url || null,
        supported_mc_versions: input.supported_mc_versions || [],
        changelog: input.changelog || null,
        added_at: Date.now(),
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
    case 'get_mod_details': {
      const id = args.modrinthId as string;
      const mockDetails: Record<string, any> = {
        'mock-sodium': {
          id: 'mock-sodium',
          slug: 'sodium',
          title: 'Sodium',
          description: 'Modern rendering engine for Minecraft that greatly improves frame rates and reduces stuttering.',
          source_url: 'https://github.com/CaffeineMC/sodium',
          license: { id: 'lgpl-3', name: 'GNU Lesser General Public License v3' },
          versions: ['1.21.1', '1.20.4', '1.20.1'],
          downloads: 15000000,
          icon_url: null,
        },
        'mock-iris': {
          id: 'mock-iris',
          slug: 'iris',
          title: 'Iris Shaders',
          description: 'A shader loader for Minecraft with Sodium support.',
          source_url: 'https://github.com/IrisShaders/Iris',
          license: { id: 'lgpl-3', name: 'GNU Lesser General Public License v3' },
          versions: ['1.21.1', '1.20.4'],
          downloads: 8000000,
          icon_url: null,
        },
        'mock-create': {
          id: 'mock-create',
          slug: 'create',
          title: 'Create',
          description: 'A technology themed mod that adds a variety of tools and components for automation and decoration.',
          source_url: 'https://github.com/Creators-of-Create/Create',
          license: { id: 'mit', name: 'MIT License' },
          versions: ['1.21.1', '1.20.1', '1.19.2'],
          downloads: 25000000,
          icon_url: null,
        },
      };
      return Promise.resolve(mockDetails[id] || null);
    }
    case 'get_mod_versions': {
      const id = args.modrinthId as string;
      const mockVersions: Record<string, any[]> = {
        'mock-sodium': [{
          id: 'ver-sodium-1',
          project_id: 'mock-sodium',
          name: 'Sodium 0.6.0',
          version_number: '0.6.0',
          changelog: '## Changes\n- Updated rendering pipeline\n- Fixed crash with Iris',
          dependencies: [
            { version_id: null, project_id: 'mock-fabric-api', file_name: null, dependency_type: 'required' },
          ],
          game_versions: ['1.21.1', '1.20.4'],
          loaders: ['fabric', 'neoforge'],
          files: [{ hashes: { sha1: 'abc' }, url: 'https://example.com/sodium.jar', filename: 'sodium-0.6.0.jar', primary: true, size: 1234567 }],
        }],
        'mock-iris': [{
          id: 'ver-iris-1',
          project_id: 'mock-iris',
          name: 'Iris 1.8.0',
          version_number: '1.8.0',
          changelog: '## Changes\n- Added shader pack support',
          dependencies: [
            { version_id: null, project_id: 'mock-sodium', file_name: null, dependency_type: 'required' },
          ],
          game_versions: ['1.21.1'],
          loaders: ['fabric'],
          files: [],
        }],
        'mock-create': [{
          id: 'ver-create-1',
          project_id: 'mock-create',
          name: 'Create 0.5.1',
          version_number: '0.5.1',
          changelog: '## Changes\n- New mechanical crafters\n- Fixed conveyor belt issues',
          dependencies: [
            { version_id: null, project_id: 'mock-flywheel', file_name: null, dependency_type: 'required' },
            { version_id: null, project_id: 'mock-registrate', file_name: null, dependency_type: 'required' },
          ],
          game_versions: ['1.21.1', '1.20.1'],
          loaders: ['forge', 'neoforge'],
          files: [],
        }],
      };
      return Promise.resolve(mockVersions[id] || []);
    }
    case 'import_modpack': {
      const id = `mock-${mockIdCounter++}`;
      const now = Date.now();
      const project = {
        id,
        name: 'Imported Pack',
        description: 'Imported from file',
        mc_version: '1.21.1',
        loader: 'neoforge',
        author: '',
        tags: '[]',
        created_at: now,
        updated_at: now,
      };
      mockProjects.set(id, project);
      mockMods.set(id, [
        { id: `mod-${mockIdCounter++}`, project_id: id, modrinth_id: null, slug: 'imported-mod-1', name: 'Imported Mod 1', version_number: '1.0', icon_url: null, description: 'Imported from pack', author: null, source_url: null, license: null },
        { id: `mod-${mockIdCounter++}`, project_id: id, modrinth_id: null, slug: 'imported-mod-2', name: 'Imported Mod 2', version_number: '2.0', icon_url: null, description: 'Imported from pack', author: null, source_url: null, license: null },
      ]);
      return Promise.resolve(project);
    }
    case 'search_modpacks': {
      return Promise.resolve({
        hits: [
          {
            project_id: 'modpack-fabulously-optimized',
            slug: 'fabulously-optimized',
            title: 'Fabulously Optimized',
            description: 'A performance-focused modpack with OptiFine parity.',
            author: 'Madis0',
            icon_url: null,
            downloads: 5000000,
            loaders: ['fabric'],
            versions: ['1.21.1', '1.20.4'],
            project_type: 'modpack',
            categories: ['optimization'],
          },
          {
            project_id: 'modpack-atm9',
            slug: 'all-the-mods-9',
            title: 'All the Mods 9',
            description: 'A large kitchen-sink modpack with something for everyone.',
            author: 'ATMTeam',
            icon_url: null,
            downloads: 3000000,
            loaders: ['forge'],
            versions: ['1.20.1'],
            project_type: 'modpack',
            categories: ['kitchen-sink'],
          },
        ],
        total_hits: 2,
        offset: 0,
        limit: 10,
      });
    }
    case 'import_modpack_from_modrinth': {
      const id = `mock-${mockIdCounter++}`;
      const now = Date.now();
      const project = {
        id,
        name: 'Fabulously Optimized',
        description: 'A performance-focused modpack',
        mc_version: '1.21.1',
        loader: 'fabric',
        author: '',
        tags: '[]',
        created_at: now,
        updated_at: now,
      };
      mockProjects.set(id, project);
      mockMods.set(id, [
        { id: `mod-${mockIdCounter++}`, project_id: id, modrinth_id: 'mock-sodium', slug: 'sodium', name: 'Sodium', version_number: '0.6.0', icon_url: null, description: 'Modern rendering engine', author: 'jellysquid3', source_url: 'https://github.com/CaffeineMC/sodium', license: 'lgpl-3' },
        { id: `mod-${mockIdCounter++}`, project_id: id, modrinth_id: 'mock-iris', slug: 'iris', name: 'Iris Shaders', version_number: '1.8.0', icon_url: null, description: 'Shader loader', author: 'coderbot', source_url: null, license: null },
      ]);
      return Promise.resolve(project);
    }
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

// Import modpack from file
export const importModpack = (filePath: string): Promise<Project> =>
  callInvoke('import_modpack', { filePath });

// Search modpacks on Modrinth
export const searchModpacks = (query: string, gameVersions?: string[], limit?: number, offset?: number): Promise<ModrinthSearchResult> =>
  callInvoke('search_modpacks', { query, gameVersions, limit, offset });

// Import modpack from Modrinth
export const importModpackFromModrinth = (modrinthId: string): Promise<Project> =>
  callInvoke('import_modpack_from_modrinth', { modrinthId });
