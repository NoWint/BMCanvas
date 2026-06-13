import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import * as tauri from '../../lib/tauri';
import type { ModrinthSearchHit, ModpackContent } from '../../types';
import { CategoryTabs } from '../search/CategoryTabs';
import { ModCard } from '../search/ModCard';

const MOD_CATEGORIES = ['popular', 'newest', 'optimization', 'adventure', 'redstone', 'magic', 'technology', 'decoration', 'food', 'worldgen'];
const MODPACK_CATEGORIES = ['popular', 'newest', 'lightweight', 'large', 'multiplayer'];

function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function SearchPanel() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<ModrinthSearchHit[]>([]);
  const [categoryResults, setCategoryResults] = useState<ModrinthSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [searchType, setSearchType] = useState<'mods' | 'modpacks'>('mods');
  const [activeCategory, setActiveCategory] = useState('popular');
  const [previewModpack, setPreviewModpack] = useState<ModpackContent | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const { addMod, currentProject, selectProject, loadProjects } = useProjectStore();
  const { closePanel, hideWelcome } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }
    const doSearch = async () => {
      setLoading(true);
      try {
        if (searchType === 'modpacks') {
          const res = await tauri.searchModpacks(debouncedQuery, currentProject ? [currentProject.mc_version] : undefined);
          setResults(res.hits);
        } else {
          const res = await tauri.searchMods(debouncedQuery, {
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
    doSearch();
  }, [debouncedQuery, searchType, currentProject]);

  // Load category browsing when no search query
  useEffect(() => {
    if (debouncedQuery.trim()) return;
    const loadCategory = async () => {
      setCategoryLoading(true);
      try {
        if (searchType === 'modpacks') {
          const res = await tauri.searchModpacksByCategory(activeCategory);
          setCategoryResults(res.hits);
        } else {
          const res = await tauri.searchModsByCategory(
            activeCategory,
            currentProject ? [currentProject.loader] : undefined,
            currentProject ? [currentProject.mc_version] : undefined,
          );
          setCategoryResults(res.hits);
        }
      } catch (e) {
        console.error('Category load failed:', e);
      } finally {
        setCategoryLoading(false);
      }
    };
    loadCategory();
  }, [activeCategory, searchType, debouncedQuery, currentProject]);

  const handleAdd = useCallback(async (hit: ModrinthSearchHit) => {
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
  }, [currentProject, addMod]);

  const handlePreviewModpack = useCallback(async (hit: ModrinthSearchHit) => {
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
  }, [previewModpack]);

  const handleAddModpack = useCallback(async (hit: ModrinthSearchHit) => {
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
  }, [loadProjects, selectProject, hideWelcome, closePanel]);

  const handleCategorySelect = useCallback((cat: string) => {
    setActiveCategory(cat);
  }, []);

  const handleSearchTypeChange = useCallback((type: 'mods' | 'modpacks') => {
    setSearchType(type);
    setPreviewModpack(null);
    setActiveCategory('popular');
  }, []);

  const isSearching = debouncedQuery.trim().length > 0;

  const renderSearchResult = (hit: ModrinthSearchHit) => (
    <div key={hit.project_id}>
      <div className="flex items-center gap-3 px-5 py-3 hover:bg-[rgba(255,255,255,0.04)] cursor-pointer transition-colors duration-150 border-b border-[rgba(255,255,255,0.04)]">
        <div
          className="w-10 h-10 rounded-xl bg-[#1c1c1e] flex items-center justify-center text-sm text-[#48484a] shrink-0 overflow-hidden"
          onClick={() => searchType === 'modpacks' && handlePreviewModpack(hit)}
        >
          {hit.icon_url ? (
            <img src={hit.icon_url} alt="" className="w-full h-full object-cover rounded-xl" />
          ) : (
            hit.title[0]
          )}
        </div>
        <div
          className="flex-1 min-w-0"
          onClick={() => searchType === 'modpacks' && handlePreviewModpack(hit)}
        >
          <div className="text-[13px] text-[#f5f5f7] font-medium">{hit.title}</div>
          <div className="text-[11px] text-[#86868b] truncate">{hit.description}</div>
          <div className="flex gap-2 mt-0.5 text-[10px] text-[#48484a]">
            <span>{hit.author}</span>
            <span>·</span>
            <span>{formatDownloads(hit.downloads)} {t('search.downloads')}</span>
            {hit.versions?.length > 0 && (
              <>
                <span>·</span>
                <span className="text-[#0a84ff]">{hit.versions[0]}</span>
              </>
            )}
          </div>
        </div>
        {currentProject && searchType === 'mods' && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded ${
            hit.versions?.includes(currentProject.mc_version)
              ? 'text-[#30d158] bg-[rgba(48,209,88,0.1)]'
              : 'text-[#ff453a] bg-[rgba(255,69,58,0.1)]'
          }`}>
            {currentProject.mc_version}
          </span>
        )}
        {searchType === 'modpacks' ? (
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); handlePreviewModpack(hit); }}
              className="px-2.5 py-1 border border-[rgba(255,255,255,0.1)] text-[#86868b] text-[10px] font-medium rounded-lg hover:border-[#0a84ff] hover:text-[#0a84ff] transition-colors duration-150"
              disabled={previewLoading}
            >
              {previewLoading && previewModpack?.name !== hit.title ? '...' : t('search.view')}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleAddModpack(hit); }}
              className="px-2.5 py-1 bg-[#30d158] text-[#000] text-[10px] font-semibold rounded-lg hover:bg-[#4ade80] transition-colors duration-150 disabled:opacity-50"
              disabled={importingId === hit.project_id}
            >
              {importingId === hit.project_id ? '...' : t('search.import')}
            </button>
          </div>
        ) : currentProject ? (
          <button
            onClick={() => handleAdd(hit)}
            className="px-3 py-1 bg-[#0a84ff] text-white text-[10px] font-semibold rounded-lg hover:bg-[#409cff] transition-colors duration-150"
          >
            {t('search.add')}
          </button>
        ) : (
          <span className="text-[9px] text-[#48484a] px-2 py-1 select-none">{t('search.selectProjectFirst')}</span>
        )}
      </div>

      {/* Modpack preview panel */}
      {searchType === 'modpacks' && previewModpack && previewModpack.name === hit.title && (
        <div className="bg-[rgba(0,0,0,0.3)] border-b border-[rgba(255,255,255,0.04)] px-5 py-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] text-[#0a84ff] font-semibold">{previewModpack.name}</span>
            <span className="text-[9px] text-[#48484a] font-mono">{previewModpack.mc_version} · {previewModpack.loader}</span>
            <span className="text-[9px] text-[#48484a]">{formatDownloads(previewModpack.downloads)} {t('search.downloads')}</span>
          </div>
          {previewModpack.description && (
            <div className="text-[10px] text-[#86868b] mb-2">{previewModpack.description}</div>
          )}
          <div className="text-[9px] text-[#48484a] uppercase tracking-wider mb-1.5">
            {t('search.contains', { count: previewModpack.mods.length })}
          </div>
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {previewModpack.mods.map((mod) => (
              <div
                key={mod.project_id}
                className="flex items-center gap-2 px-2 py-1.5 bg-[rgba(0,0,0,0.3)] rounded-lg border border-[rgba(255,255,255,0.04)]"
              >
                <div className="w-5 h-5 rounded bg-[#1c1c1e] flex items-center justify-center text-[8px] text-[#48484a] shrink-0 overflow-hidden">
                  {mod.icon_url ? (
                    <img src={mod.icon_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    mod.name[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#f5f5f7] font-medium">{mod.name}</div>
                  {mod.description && (
                    <div className="text-[8px] text-[#48484a] truncate">{mod.description}</div>
                  )}
                </div>
                <span className={`text-[8px] px-1 py-0.5 rounded ${
                  mod.dep_type === 'required'
                    ? 'text-[#0a84ff] bg-[rgba(10,132,255,0.1)]'
                    : 'text-[#86868b] bg-[rgba(255,255,255,0.04)]'
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
    <div className="absolute inset-0 z-20 flex items-start justify-center pt-[6vh]">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.85)] backdrop-blur-[60px]" onClick={closePanel} />
      <div className="relative w-[720px] max-h-[82vh] bg-[rgba(28,28,30,0.95)] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col">
        {/* Search header */}
        <div className="flex items-center gap-3 px-5 py-4 shrink-0">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#48484a] text-sm">🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchType === 'modpacks' ? t('search.searchModpacks') : t('search.searchMods')}
              className="w-full h-12 pl-9 pr-4 rounded-xl bg-[rgba(255,255,255,0.06)] text-[14px] text-[#f5f5f7] placeholder-[#48484a] outline-none border border-transparent focus:border-[rgba(10,132,255,0.3)] transition-colors duration-200"
            />
          </div>
          <kbd className="text-[10px] font-mono text-[#48484a] shrink-0">⌘K</kbd>
        </div>

        {/* Main tabs: Mods / Modpacks */}
        <div className="flex px-5 gap-1 shrink-0">
          <button
            onClick={() => handleSearchTypeChange('mods')}
            className={`px-4 py-2 text-[12px] font-medium rounded-lg transition-all duration-200 ${
              searchType === 'mods'
                ? 'bg-[rgba(10,132,255,0.15)] text-[#0a84ff]'
                : 'text-[#86868b] hover:text-[#f5f5f7]'
            }`}
          >
            {t('search.mods')}
          </button>
          <button
            onClick={() => handleSearchTypeChange('modpacks')}
            className={`px-4 py-2 text-[12px] font-medium rounded-lg transition-all duration-200 ${
              searchType === 'modpacks'
                ? 'bg-[rgba(10,132,255,0.15)] text-[#0a84ff]'
                : 'text-[#86868b] hover:text-[#f5f5f7]'
            }`}
          >
            {t('search.modpacks')}
          </button>
        </div>

        {/* Category tabs */}
        <CategoryTabs
          categories={searchType === 'mods' ? MOD_CATEGORIES : MODPACK_CATEGORIES}
          active={activeCategory}
          onSelect={handleCategorySelect}
        />

        {/* Content area */}
        <div className="overflow-y-auto flex-1">
          {isSearching ? (
            /* Search results mode */
            <>
              {loading && (
                <div className="px-5 py-10 text-center text-[#86868b] text-[13px]">{t('search.searching')}</div>
              )}
              {!loading && results.length === 0 && (
                <div className="px-5 py-10 text-center text-[#48484a] text-[13px]">{t('search.noResults')}</div>
              )}
              {!loading && results.map((hit) => renderSearchResult(hit))}
            </>
          ) : (
            /* Category browsing mode */
            <>
              {categoryLoading && (
                <div className="px-5 py-10 text-center text-[#86868b] text-[13px]">{t('search.searching')}</div>
              )}
              {!categoryLoading && categoryResults.length === 0 && (
                <div className="px-5 py-10 text-center text-[#48484a] text-[13px]">{t('search.noResults')}</div>
              )}
              {!categoryLoading && searchType === 'mods' && categoryResults.length > 0 && (
                <div className="px-5 pb-5">
                  <div className="flex gap-3 flex-wrap">
                    {categoryResults.map((hit) => (
                      <ModCard
                        key={hit.project_id}
                        hit={hit}
                        onAdd={handleAdd}
                        canAdd={!!currentProject}
                      />
                    ))}
                  </div>
                </div>
              )}
              {!categoryLoading && searchType === 'modpacks' && categoryResults.length > 0 && (
                <div className="px-5 pb-5">
                  <div className="grid grid-cols-2 gap-3">
                    {categoryResults.map((hit) => (
                      <div
                        key={hit.project_id}
                        className="glass-card p-4 cursor-pointer hover:border-[rgba(10,132,255,0.3)] transition-colors duration-200"
                        onClick={() => handlePreviewModpack(hit)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#1c1c1e] flex items-center justify-center text-lg text-[#48484a] shrink-0 overflow-hidden">
                            {hit.icon_url ? (
                              <img src={hit.icon_url} alt="" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              hit.title[0]
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] text-[#f5f5f7] font-semibold leading-tight mb-1 truncate">{hit.title}</div>
                            <div className="text-[11px] text-[#86868b] leading-snug mb-2 line-clamp-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{hit.description}</div>
                            <div className="flex items-center gap-2 text-[10px] text-[#48484a]">
                              <span>⬇ {formatDownloads(hit.downloads)}</span>
                              {hit.versions?.length > 0 && (
                                <span className="text-[#0a84ff]">{hit.versions[0]}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePreviewModpack(hit); }}
                            className="flex-1 px-2 py-1.5 border border-[rgba(255,255,255,0.1)] text-[#86868b] text-[10px] font-medium rounded-lg hover:border-[#0a84ff] hover:text-[#0a84ff] transition-colors duration-150"
                          >
                            {t('search.view')}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAddModpack(hit); }}
                            className="flex-1 px-2 py-1.5 bg-[#30d158] text-[#000] text-[10px] font-semibold rounded-lg hover:bg-[#4ade80] transition-colors duration-150 disabled:opacity-50"
                            disabled={importingId === hit.project_id}
                          >
                            {importingId === hit.project_id ? '...' : t('search.import')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Modpack preview panel in category browsing */}
                  {previewModpack && (
                    <div className="mt-4 bg-[rgba(0,0,0,0.3)] rounded-xl border border-[rgba(255,255,255,0.04)] p-4 animate-fade-in">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[12px] text-[#0a84ff] font-semibold">{previewModpack.name}</span>
                        <span className="text-[10px] text-[#48484a] font-mono">{previewModpack.mc_version} · {previewModpack.loader}</span>
                        <span className="text-[10px] text-[#48484a]">{formatDownloads(previewModpack.downloads)} {t('search.downloads')}</span>
                      </div>
                      {previewModpack.description && (
                        <div className="text-[11px] text-[#86868b] mb-2">{previewModpack.description}</div>
                      )}
                      <div className="text-[9px] text-[#48484a] uppercase tracking-wider mb-1.5">
                        {t('search.contains', { count: previewModpack.mods.length })}
                      </div>
                      <div className="max-h-[200px] overflow-y-auto space-y-1">
                        {previewModpack.mods.map((mod) => (
                          <div
                            key={mod.project_id}
                            className="flex items-center gap-2 px-2 py-1.5 bg-[rgba(0,0,0,0.3)] rounded-lg border border-[rgba(255,255,255,0.04)]"
                          >
                            <div className="w-5 h-5 rounded bg-[#1c1c1e] flex items-center justify-center text-[8px] text-[#48484a] shrink-0 overflow-hidden">
                              {mod.icon_url ? (
                                <img src={mod.icon_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                mod.name[0]
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] text-[#f5f5f7] font-medium">{mod.name}</div>
                              {mod.description && (
                                <div className="text-[8px] text-[#48484a] truncate">{mod.description}</div>
                              )}
                            </div>
                            <span className={`text-[8px] px-1 py-0.5 rounded ${
                              mod.dep_type === 'required'
                                ? 'text-[#0a84ff] bg-[rgba(10,132,255,0.1)]'
                                : 'text-[#86868b] bg-[rgba(255,255,255,0.04)]'
                            }`}>
                              {mod.dep_type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
