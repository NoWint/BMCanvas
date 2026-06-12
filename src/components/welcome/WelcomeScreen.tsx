import { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import * as tauri from '../../lib/tauri';
import type { Loader } from '../../types';

const MC_VERSIONS = ['1.21.1', '1.21', '1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.16.5'];
const LOADERS: Loader[] = ['neoforge', 'forge', 'fabric', 'quilt'];

const TRENDING_MODPACKS = [
  { project_id: 'modpack-fabulously-optimized', name: 'Fabulously Optimized', loader: 'fabric' as Loader, mc_version: '1.21.1', downloads: 5000000 },
  { project_id: 'modpack-atm9', name: 'All the Mods 9', loader: 'forge' as Loader, mc_version: '1.20.1', downloads: 3000000 },
  { project_id: 'modpack-better-mc', name: 'Better Minecraft', loader: 'fabric' as Loader, mc_version: '1.20.4', downloads: 2000000 },
];

function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function WelcomeScreen() {
  const { projects, loadProjects, createProject, selectProject, deleteProject, addMod } = useProjectStore();
  const { hideWelcome } = useUIStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [mcVersion, setMcVersion] = useState('1.21.1');
  const [loader, setLoader] = useState<Loader>('neoforge');
  const [description, setDescription] = useState('');
  const [importing, setImporting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const project = await createProject({
      name: name.trim(),
      description,
      mc_version: mcVersion,
      loader,
      author: '',
      tags: [],
    });
    await selectProject(project.id);
    hideWelcome();
  };

  const handleSelect = async (id: string) => {
    await selectProject(id);
    hideWelcome();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteProject(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      const project = await createProject({
        name: 'Demo Pack',
        description: 'A demo modpack to explore ModCanvas',
        mc_version: '1.21.1',
        loader: 'fabric',
        author: '',
        tags: [],
      });
      await selectProject(project.id);
      const demoMods = [
        { modrinth_id: 'mock-sodium', slug: 'sodium', name: 'Sodium', icon_url: null as string | null, description: 'Modern rendering engine', author: 'jellysquid3' },
        { modrinth_id: 'mock-iris', slug: 'iris', name: 'Iris Shaders', icon_url: null as string | null, description: 'Shader loader for Sodium', author: 'coderbot' },
        { modrinth_id: 'mock-create', slug: 'create', name: 'Create', icon_url: null as string | null, description: 'Technology and automation', author: 'simibubi' },
        { modrinth_id: 'mock-fabric-api', slug: 'fabric-api', name: 'Fabric API', icon_url: null as string | null, description: 'Fabric mod loader API', author: 'modmuss50' },
      ];
      for (const mod of demoMods) {
        await addMod({
          modrinth_id: mod.modrinth_id,
          slug: mod.slug,
          name: mod.name,
          icon_url: mod.icon_url,
          description: mod.description,
          author: mod.author,
          version_id: null,
          version_number: null,
          source_url: null,
          license: null,
          homepage_url: null,
          supported_mc_versions: [],
          changelog: null,
        });
      }
      hideWelcome();
    } catch (e) {
      console.error('Demo creation failed:', e);
    } finally {
      setDemoLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      if ((window as any).__TAURI_INTERNALS__) {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          multiple: false,
          filters: [{ name: 'Modpack', extensions: ['mrpack', 'zip'] }],
        });
        if (selected) {
          const project = await tauri.importModpack(selected as string);
          await loadProjects();
          await selectProject(project.id);
          hideWelcome();
        }
      } else {
        // Browser mode: create a mock imported project with 3 sample mods
        const project = await createProject({
          name: 'Imported Pack',
          description: 'Imported from file',
          mc_version: '1.21.1',
          loader: 'fabric',
          author: '',
          tags: [],
        });
        await selectProject(project.id);
        const importMods = [
          { modrinth_id: 'mock-sodium', slug: 'sodium', name: 'Sodium', icon_url: null as string | null, description: 'Modern rendering engine', author: 'jellysquid3' },
          { modrinth_id: 'mock-iris', slug: 'iris', name: 'Iris Shaders', icon_url: null as string | null, description: 'Shader loader for Sodium', author: 'coderbot' },
          { modrinth_id: 'mock-fabric-api', slug: 'fabric-api', name: 'Fabric API', icon_url: null as string | null, description: 'Fabric mod loader API', author: 'modmuss50' },
        ];
        for (const mod of importMods) {
          await addMod({
            modrinth_id: mod.modrinth_id,
            slug: mod.slug,
            name: mod.name,
            icon_url: mod.icon_url,
            description: mod.description,
            author: mod.author,
            version_id: null,
            version_number: null,
            source_url: null,
            license: null,
            homepage_url: null,
            supported_mc_versions: [],
            changelog: null,
          });
        }
        hideWelcome();
      }
    } catch (e) {
      console.error('Import failed:', e);
      alert(`Import failed: ${e}`);
    } finally {
      setImporting(false);
    }
  };

  const handleTrendingImport = async (project_id: string) => {
    try {
      await tauri.importModpackFromModrinth(project_id);
      await loadProjects();
      const projects = useProjectStore.getState().projects;
      const imported = projects[0];
      if (imported) {
        await selectProject(imported.id);
        hideWelcome();
      }
    } catch (e) {
      console.error('Trending import failed:', e);
      alert(`Import failed: ${e}`);
    }
  };

  return (
    <div className="absolute inset-0 z-30 bg-[#09090B] flex items-center justify-center animate-fade-in overflow-y-auto">
      <div className="w-full max-w-[640px] px-6 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <h1
            className="text-[28px] font-semibold text-[#FAFAFA]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            ModCanvas
          </h1>
          <p className="text-[12px] text-[#71717A] mt-1">Design Minecraft Modpacks Visually</p>
        </div>

        {/* Section 1: Quick Actions */}
        <div className="mb-8">
          <div className="text-[9px] text-[#52525B] uppercase tracking-wider mb-3">Quick Actions</div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleDemo}
              disabled={demoLoading}
              className="px-3 py-3 bg-[#111113] border border-[#27272A] rounded-lg hover:border-[#D4A017] hover:bg-[#18181B] transition-colors duration-100 disabled:opacity-50 text-center"
            >
              <div className="text-[10px] text-[#D4A017] font-semibold mb-0.5">
                {demoLoading ? '...' : '⚡'}
              </div>
              <div className="text-[10px] text-[#FAFAFA] font-medium">Quick Demo</div>
              <div className="text-[8px] text-[#52525B] mt-0.5">4 sample mods</div>
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="px-3 py-3 bg-[#111113] border border-[#27272A] rounded-lg hover:border-[#D4A017] hover:bg-[#18181B] transition-colors duration-100 text-center"
            >
              <div className="text-[10px] text-[#D4A017] font-semibold mb-0.5">+</div>
              <div className="text-[10px] text-[#FAFAFA] font-medium">Create New</div>
              <div className="text-[8px] text-[#52525B] mt-0.5">Blank modpack</div>
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-3 py-3 bg-[#111113] border border-[#27272A] rounded-lg hover:border-[#22C55E] hover:bg-[#18181B] transition-colors duration-100 disabled:opacity-50 text-center"
            >
              <div className="text-[10px] text-[#22C55E] font-semibold mb-0.5">
                {importing ? '...' : '↓'}
              </div>
              <div className="text-[10px] text-[#FAFAFA] font-medium">Import File</div>
              <div className="text-[8px] text-[#52525B] mt-0.5">.mrpack / .zip</div>
            </button>
          </div>
        </div>

        {/* Create Form (conditional) */}
        {showCreate && (
          <div className="bg-[#111113] border border-[#27272A] rounded-lg p-4 mb-8 space-y-3">
            <div className="text-[10px] text-[#FAFAFA] font-medium">Create New Pack</div>
            <div>
              <label className="text-[9px] text-[#52525B] uppercase tracking-wider">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tech Revolution"
                className="w-full mt-1 px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-md text-[11px] text-[#FAFAFA] placeholder-[#3F3F46] outline-none focus:border-[#D4A017] transition-colors duration-100"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[9px] text-[#52525B] uppercase tracking-wider">MC Version</label>
                <select
                  value={mcVersion}
                  onChange={(e) => setMcVersion(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-md text-[11px] text-[#FAFAFA] outline-none focus:border-[#D4A017]"
                >
                  {MC_VERSIONS.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[9px] text-[#52525B] uppercase tracking-wider">Loader</label>
                <select
                  value={loader}
                  onChange={(e) => setLoader(e.target.value as Loader)}
                  className="w-full mt-1 px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-md text-[11px] text-[#FAFAFA] outline-none focus:border-[#D4A017]"
                >
                  {LOADERS.map((l) => (
                    <option key={l} value={l}>
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[9px] text-[#52525B] uppercase tracking-wider">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Technology-focused progression pack"
                className="w-full mt-1 px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-md text-[11px] text-[#FAFAFA] placeholder-[#3F3F46] outline-none focus:border-[#D4A017] transition-colors duration-100"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowCreate(false)}
                className="px-3 py-1.5 text-[10px] text-[#71717A] hover:text-[#FAFAFA] transition-colors duration-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-1.5 bg-[#D4A017] text-[#09090B] text-[10px] font-semibold rounded-md hover:bg-[#FFCC66] transition-colors duration-100"
              >
                Create Pack
              </button>
            </div>
          </div>
        )}

        {/* Section 2: Trending Modpacks */}
        <div className="mb-8">
          <div className="text-[9px] text-[#52525B] uppercase tracking-wider mb-3">Trending Modpacks</div>
          <div className="grid grid-cols-3 gap-2">
            {TRENDING_MODPACKS.map((mp) => (
              <div
                key={mp.project_id}
                className="bg-[#111113] border border-[#27272A] rounded-lg p-3 hover:border-[#3F3F46] transition-colors duration-100 flex flex-col"
              >
                <div className="text-[11px] text-[#FAFAFA] font-medium leading-tight mb-1">{mp.name}</div>
                <div className="text-[9px] text-[#52525B] font-mono mb-1">
                  {mp.mc_version} · {mp.loader}
                </div>
                <div className="text-[9px] text-[#3F3F46] mb-2">
                  {formatDownloads(mp.downloads)} downloads
                </div>
                <button
                  onClick={() => handleTrendingImport(mp.project_id)}
                  className="mt-auto w-full px-2 py-1 bg-[#09090B] border border-[#27272A] rounded-md text-[9px] text-[#22C55E] hover:bg-[#22C55E] hover:text-[#09090B] hover:border-[#22C55E] transition-colors duration-100 font-medium"
                >
                  Import
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Recent Projects */}
        {projects.length > 0 && (
          <div>
            <div className="text-[9px] text-[#52525B] uppercase tracking-wider mb-3">Recent Projects</div>
            <div className="space-y-1">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className="w-full text-left px-4 py-3 bg-[#111113] border border-[#27272A] rounded-lg hover:border-[#3F3F46] hover:bg-[#18181B] transition-colors duration-100 group relative"
                >
                  <div className="text-[12px] text-[#FAFAFA] font-medium">{p.name}</div>
                  <div className="text-[9px] text-[#52525B] mt-0.5 font-mono">
                    {p.mc_version} · {p.loader}
                  </div>
                  <div
                    onClick={(e) => handleDelete(p.id, e)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-[10px] text-[#3F3F46] hover:text-[#FAFAFA] hover:bg-[#27272A] opacity-0 group-hover:opacity-100 transition-all duration-100"
                  >
                    ✕
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
