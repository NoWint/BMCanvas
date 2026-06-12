import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import * as tauri from '../../lib/tauri';
import type { ModrinthSearchHit, ModpackContent } from '../../types';

const POPULAR_MODPACKS: ModrinthSearchHit[] = [
  {
    project_id: 'modpack-fabulously-optimized',
    project_type: 'modpack',
    slug: 'fabulously-optimized',
    title: 'Fabulously Optimized',
    description: 'A Fabric-based modpack focusing on performance and visual enhancements.',
    author: 'robotkoer',
    downloads: 2_500_000,
    icon_url: '',
    latest_version: '',
    client_side: '',
    server_side: '',
    versions: ['1.21.1'],
    categories: ['optimization'],
    display_categories: [],
    loaders: ['fabric'],
  },
  {
    project_id: 'modpack-atm9',
    project_type: 'modpack',
    slug: 'all-the-mods-9',
    title: 'All the Mods 9',
    description: 'A large, community-driven modpack with a wide variety of mods.',
    author: 'WhatTheDrunk',
    downloads: 1_800_000,
    icon_url: '',
    latest_version: '',
    client_side: '',
    server_side: '',
    versions: ['1.20.1'],
    categories: ['kitchen-sink'],
    display_categories: [],
    loaders: ['forge'],
  },
];

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ModrinthSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'mods' | 'modpacks'>('mods');
  const [previewModpack, setPreviewModpack] = useState<ModpackContent | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const { addMod, currentProject, selectProject, loadProjects } = useProjectStore();
  const { closePanel, hideWelcome } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setPreviewModpack(null);
    try {
      if (searchType === 'modpacks') {
        const res = await tauri.searchModpacks(query, currentProject ? [currentProject.mc_version] : undefined);
        setResults(res.hits);
      } else {
        const res = await tauri.searchMods(query, {
          loaders: currentProject ? [currentProject.loader] : undefined,
          game_versions: currentProject ? [currentProject.mc_version] : undefined,
        });
        setResults(res.hits);
      }
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (hit: ModrinthSearchHit) => {
    if (!currentProject) return;
    await addMod({
      modrinth_id: hit.project_id,
      slug: hit.slug,
      name: hit.title,
      version_id: null,
      version_number: null,
      icon_url: hit.icon_url,
      description: hit.description,
      author: hit.author,
      source_url: null,
      license: null,
      homepage_url: null,
      supported_mc_versions: [],
      changelog: null,
    });
  };

  const handlePreviewModpack = async (hit: ModrinthSearchHit) => {
    if (previewModpack && previewModpack.name === hit.title) {
      setPreviewModpack(null);
      return;
    }
    setPreviewLoading(true);
    try {
      const content = await tauri.getModpackContents(hit.project_id);
      setPreviewModpack(content);
    } catch (e) {
      console.error('Preview modpack failed:', e);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleAddModpack = async (hit: ModrinthSearchHit) => {
    setImportingId(hit.project_id);
    try {
      const project = await tauri.importModpackFromModrinth(hit.project_id);
      await loadProjects();
      await selectProject(project.id);
      hideWelcome();
      closePanel();
    } catch (e) {
      console.error('Import modpack failed:', e);
    } finally {
      setImportingId(null);
    }
  };

  const formatDownloads = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  };

  const renderHit = (hit: ModrinthSearchHit) => (
    <div key={hit.project_id}>
      <div
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1E1E22] cursor-pointer transition-colors duration-100 border-b border-[#1E1E22]/50"
      >
        <div
          className="w-8 h-8 rounded bg-[#27272A] flex items-center justify-center text-[10px] text-[#71717A] shrink-0 overflow-hidden"
          onClick={() => searchType === 'modpacks' && handlePreviewModpack(hit)}
        >
          {hit.icon_url ? (
            <img src={hit.icon_url} alt="" className="w-full h-full object-cover" />
          ) : (
            hit.title[0]
          )}
        </div>
        <div
          className="flex-1 min-w-0"
          onClick={() => searchType === 'modpacks' && handlePreviewModpack(hit)}
        >
          <div className="text-[11px] text-[#FAFAFA] font-medium">{hit.title}</div>
          <div className="text-[9px] text-[#71717A] truncate">{hit.description}</div>
          <div className="flex gap-2 mt-0.5 text-[8px] text-[#52525B]">
            <span>{hit.author}</span>
            <span>·</span>
            <span>{formatDownloads(hit.downloads)} downloads</span>
            {searchType === 'modpacks' && hit.versions?.length > 0 && (
              <>
                <span>·</span>
                <span className="text-[#D4A017]">{hit.versions[0]}</span>
              </>
            )}
          </div>
        </div>
        {currentProject && searchType === 'mods' && (
          <span className={`text-[8px] px-1.5 py-0.5 rounded ${
            hit.versions.includes(currentProject.mc_version)
              ? 'text-[#22C55E] bg-[#22C55E11]'
              : 'text-[#EF4444] bg-[#EF444411]'
          }`}>
            {currentProject.mc_version}
          </span>
        )}
        {searchType === 'modpacks' ? (
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); handlePreviewModpack(hit); }}
              className="px-2 py-1 border border-[#3F3F46] text-[#A1A1AA] text-[9px] font-medium rounded hover:border-[#D4A017] hover:text-[#D4A017] transition-colors duration-100"
              disabled={previewLoading}
            >
              {previewLoading && previewModpack?.name !== hit.title ? '...' : 'View'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleAddModpack(hit); }}
              className="px-2.5 py-1 bg-[#22C55E] text-[#09090B] text-[9px] font-semibold rounded hover:bg-[#4ADE80] transition-colors duration-100 disabled:opacity-50"
              disabled={importingId === hit.project_id}
            >
              {importingId === hit.project_id ? '...' : 'Import'}
            </button>
          </div>
        ) : currentProject ? (
          <button
            onClick={() => handleAdd(hit)}
            className="px-2.5 py-1 bg-[#D4A017] text-[#09090B] text-[9px] font-semibold rounded hover:bg-[#FFCC66] transition-colors duration-100"
          >
            Add
          </button>
        ) : (
          <span className="text-[8px] text-[#3F3F46] px-2 py-1 select-none">Select project first</span>
        )}
      </div>

      {/* Modpack preview panel */}
      {searchType === 'modpacks' && previewModpack && previewModpack.name === hit.title && (
        <div className="bg-[#111113] border-b border-[#1E1E22] px-4 py-3 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-[#D4A017] font-semibold">{previewModpack.name}</span>
            <span className="text-[8px] text-[#52525B] font-mono">{previewModpack.mc_version} · {previewModpack.loader}</span>
            <span className="text-[8px] text-[#52525B]">{formatDownloads(previewModpack.downloads)} downloads</span>
          </div>
          {previewModpack.description && (
            <div className="text-[9px] text-[#71717A] mb-2">{previewModpack.description}</div>
          )}
          <div className="text-[8px] text-[#52525B] uppercase tracking-wider mb-1.5">
            Contains {previewModpack.mods.length} mods
          </div>
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {previewModpack.mods.map((mod) => (
              <div
                key={mod.project_id}
                className="flex items-center gap-2 px-2 py-1.5 bg-[#09090B] rounded border border-[#1E1E22]"
              >
                <div className="w-5 h-5 rounded bg-[#27272A] flex items-center justify-center text-[7px] text-[#71717A] shrink-0 overflow-hidden">
                  {mod.icon_url ? (
                    <img src={mod.icon_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    mod.name[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] text-[#FAFAFA] font-medium">{mod.name}</div>
                  {mod.description && (
                    <div className="text-[7px] text-[#52525B] truncate">{mod.description}</div>
                  )}
                </div>
                <span className={`text-[7px] px-1 py-0.5 rounded ${
                  mod.dep_type === 'required'
                    ? 'text-[#D4A017] bg-[#D4A01711]'
                    : 'text-[#71717A] bg-[#71717A11]'
                }`}>
                  {mod.dep_type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center pt-[10vh]">
      <div className="absolute inset-0 bg-[#09090B]/60 backdrop-blur-sm" onClick={closePanel} />
      <div className="relative w-[560px] max-h-[70vh] bg-[#18181B] border border-[#27272A] rounded-xl shadow-2xl overflow-hidden animate-scale-in flex flex-col">
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E22] shrink-0">
          <span className="text-[#D4A017] text-sm">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={searchType === 'modpacks' ? 'Search modpacks on Modrinth...' : 'Search mods on Modrinth...'}
            className="flex-1 bg-transparent text-[13px] text-[#FAFAFA] placeholder-[#3F3F46] outline-none"
          />
          <button
            onClick={handleSearch}
            className="px-3 py-1 bg-[#D4A017] text-[#09090B] text-[11px] font-semibold rounded-md hover:bg-[#FFCC66] transition-colors duration-100"
          >
            Search
          </button>
          <kbd className="text-[8px] font-mono text-[#3F3F46]">⌘K</kbd>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1E1E22] shrink-0">
          <button
            onClick={() => { setSearchType('mods'); setPreviewModpack(null); }}
            className={`flex-1 py-1.5 text-[10px] font-medium transition-colors duration-100 ${
              searchType === 'mods' ? 'text-[#D4A017] border-b-2 border-[#D4A017]' : 'text-[#52525B] hover:text-[#A1A1AA]'
            }`}
          >
            Mods
          </button>
          <button
            onClick={() => { setSearchType('modpacks'); setPreviewModpack(null); }}
            className={`flex-1 py-1.5 text-[10px] font-medium transition-colors duration-100 ${
              searchType === 'modpacks' ? 'text-[#D4A017] border-b-2 border-[#D4A017]' : 'text-[#52525B] hover:text-[#A1A1AA]'
            }`}
          >
            Modpacks
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {/* Browse Popular - shown when modpacks tab is active and no query */}
          {searchType === 'modpacks' && !query && !loading && results.length === 0 && (
            <div className="px-4 py-3 border-b border-[#1E1E22]/50">
              <div className="text-[8px] text-[#52525B] uppercase tracking-wider mb-2">Browse Popular</div>
              <div className="flex gap-2">
                {POPULAR_MODPACKS.map((pack) => (
                  <div
                    key={pack.project_id}
                    className="flex-1 bg-[#0C0C0E] border border-[#1E1E22] rounded-lg p-3 hover:border-[#D4A017]/40 transition-colors duration-100 cursor-pointer"
                    onClick={() => handleAddModpack(pack)}
                  >
                    <div className="w-7 h-7 rounded bg-[#27272A] flex items-center justify-center text-[10px] text-[#D4A017] mb-2">
                      {pack.icon_url ? (
                        <img src={pack.icon_url} alt="" className="w-full h-full object-cover rounded" />
                      ) : (
                        pack.title[0]
                      )}
                    </div>
                    <div className="text-[10px] text-[#FAFAFA] font-medium">{pack.title}</div>
                    <div className="text-[8px] text-[#52525B] mt-0.5">{formatDownloads(pack.downloads)} downloads</div>
                    {pack.versions?.length > 0 && (
                      <div className="text-[8px] text-[#D4A017] mt-0.5">{pack.versions[0]}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="px-4 py-8 text-center text-[#52525B] text-xs">Searching...</div>
          )}
          {!loading && results.length === 0 && query && (
            <div className="px-4 py-8 text-center text-[#3F3F46] text-xs">No results found</div>
          )}
          {results.map((hit) => renderHit(hit))}
        </div>
      </div>
    </div>
  );
}
