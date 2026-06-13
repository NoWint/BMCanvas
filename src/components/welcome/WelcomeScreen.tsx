import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    <div className="absolute inset-0 z-30 bg-[#000000] flex items-center justify-center animate-fade-in overflow-y-auto">
      <div className="w-full max-w-[640px] px-6 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <h1
            className="text-[32px] font-semibold text-[#f5f5f7]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {t('welcome.title')}
          </h1>
          <p className="text-[13px] text-[#86868b] mt-2">{t('welcome.subtitle')}</p>
        </div>

        {/* Section 1: Quick Actions */}
        <div className="mb-8">
          <div className="text-[9px] text-[#48484a] uppercase tracking-wider mb-3">Quick Actions</div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleDemo}
              disabled={demoLoading}
              className="glass-card px-4 py-4 hover:border-[#0a84ff] disabled:opacity-50 text-center"
            >
              <div className="text-[11px] text-[#0a84ff] font-semibold mb-1">
                {demoLoading ? '...' : '⚡'}
              </div>
              <div className="text-[13px] text-[#f5f5f7] font-medium">{t('welcome.quickDemo')}</div>
              <div className="text-[9px] text-[#48484a] mt-1">{t('welcome.demoMods')}</div>
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="glass-card px-4 py-4 hover:border-[#0a84ff] text-center"
            >
              <div className="text-[11px] text-[#0a84ff] font-semibold mb-1">+</div>
              <div className="text-[13px] text-[#f5f5f7] font-medium">{t('welcome.createNew')}</div>
              <div className="text-[9px] text-[#48484a] mt-1">{t('welcome.blankModpack')}</div>
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="glass-card px-4 py-4 hover:border-[#30d158] disabled:opacity-50 text-center"
            >
              <div className="text-[11px] text-[#30d158] font-semibold mb-1">
                {importing ? '...' : '↓'}
              </div>
              <div className="text-[13px] text-[#f5f5f7] font-medium">{t('welcome.importFile')}</div>
              <div className="text-[9px] text-[#48484a] mt-1">{t('welcome.mrpackZip')}</div>
            </button>
          </div>
        </div>

        {/* Create Form (conditional) */}
        {showCreate && (
          <div className="glass-panel rounded-xl p-5 mb-8 space-y-3">
            <div className="text-[13px] text-[#f5f5f7] font-medium">{t('common.createPack')}</div>
            <div>
              <label className="text-[9px] text-[#48484a] uppercase tracking-wider">{t('common.name')}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tech Revolution"
                className="w-full mt-1 px-3 py-2 bg-[#000000] border border-[rgba(255,255,255,0.08)] rounded-lg text-[13px] text-[#f5f5f7] placeholder-[#48484a] outline-none focus:border-[#0a84ff] transition-colors duration-300"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[9px] text-[#48484a] uppercase tracking-wider">{t('common.minecraftVersion')}</label>
                <select
                  value={mcVersion}
                  onChange={(e) => setMcVersion(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#000000] border border-[rgba(255,255,255,0.08)] rounded-lg text-[13px] text-[#f5f5f7] outline-none focus:border-[#0a84ff] transition-colors duration-300"
                >
                  {MC_VERSIONS.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[9px] text-[#48484a] uppercase tracking-wider">{t('common.loader')}</label>
                <select
                  value={loader}
                  onChange={(e) => setLoader(e.target.value as Loader)}
                  className="w-full mt-1 px-3 py-2 bg-[#000000] border border-[rgba(255,255,255,0.08)] rounded-lg text-[13px] text-[#f5f5f7] outline-none focus:border-[#0a84ff] transition-colors duration-300"
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
              <label className="text-[9px] text-[#48484a] uppercase tracking-wider">{t('common.description')}</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Technology-focused progression pack"
                className="w-full mt-1 px-3 py-2 bg-[#000000] border border-[rgba(255,255,255,0.08)] rounded-lg text-[13px] text-[#f5f5f7] placeholder-[#48484a] outline-none focus:border-[#0a84ff] transition-colors duration-300"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowCreate(false)}
                className="btn-secondary px-4 py-2 text-[11px]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreate}
                className="btn-primary px-5 py-2 text-[11px]"
              >
                {t('common.createPack')}
              </button>
            </div>
          </div>
        )}

        {/* Section 2: Trending Modpacks */}
        <div className="mb-8">
          <div className="text-[9px] text-[#48484a] uppercase tracking-wider mb-3">{t('welcome.trendingModpacks')}</div>
          <div className="grid grid-cols-3 gap-3">
            {TRENDING_MODPACKS.map((mp) => (
              <div
                key={mp.project_id}
                className="glass-card p-4 flex flex-col"
              >
                <div className="text-[13px] text-[#f5f5f7] font-medium leading-tight mb-1">{mp.name}</div>
                <div className="text-[9px] text-[#86868b] font-mono mb-1">
                  {mp.mc_version} · {mp.loader}
                </div>
                <div className="text-[9px] text-[#48484a] mb-3">
                  {formatDownloads(mp.downloads)} {t('welcome.downloads')}
                </div>
                <button
                  onClick={() => handleTrendingImport(mp.project_id)}
                  className="mt-auto w-full btn-success px-2 py-1.5 text-[9px] font-medium"
                >
                  {t('search.import')}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Recent Projects */}
        {projects.length > 0 && (
          <div>
            <div className="text-[9px] text-[#48484a] uppercase tracking-wider mb-3">{t('welcome.recentProjects')}</div>
            <div className="space-y-2">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className="w-full text-left px-4 py-3 glass-card-static hover:border-[rgba(255,255,255,0.12)] group relative"
                >
                  <div className="text-[13px] text-[#f5f5f7] font-medium">{p.name}</div>
                  <div className="text-[9px] text-[#86868b] mt-0.5 font-mono">
                    {p.mc_version} · {p.loader}
                  </div>
                  <div
                    onClick={(e) => handleDelete(p.id, e)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-[11px] text-[#48484a] hover:text-[#f5f5f7] hover:bg-[rgba(255,255,255,0.08)] opacity-0 group-hover:opacity-100 transition-all duration-300"
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
