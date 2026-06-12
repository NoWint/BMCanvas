import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import * as tauri from '../../lib/tauri';
import type { ModrinthSearchHit } from '../../types';

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ModrinthSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const { addMod, currentProject } = useProjectStore();
  const { closePanel } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await tauri.searchMods(query, {
        loaders: currentProject ? [currentProject.loader] : undefined,
        game_versions: currentProject ? [currentProject.mc_version] : undefined,
      });
      setResults(res.hits);
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (hit: ModrinthSearchHit) => {
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

  const formatDownloads = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  };

  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center pt-[10vh]">
      <div className="absolute inset-0 bg-[#09090B]/60 backdrop-blur-sm" onClick={closePanel} />
      <div className="relative w-[560px] max-h-[60vh] bg-[#18181B] border border-[#27272A] rounded-xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E22]">
          <span className="text-[#D4A017] text-sm">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search mods on Modrinth..."
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
        <div className="overflow-y-auto max-h-[calc(60vh-52px)]">
          {loading && (
            <div className="px-4 py-8 text-center text-[#52525B] text-xs">Searching...</div>
          )}
          {!loading && results.length === 0 && query && (
            <div className="px-4 py-8 text-center text-[#3F3F46] text-xs">No results found</div>
          )}
          {results.map((hit) => (
            <div
              key={hit.project_id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1E1E22] cursor-pointer transition-colors duration-100 border-b border-[#1E1E22]/50"
            >
              <div className="w-8 h-8 rounded bg-[#27272A] flex items-center justify-center text-[10px] text-[#71717A] shrink-0 overflow-hidden">
                {hit.icon_url ? (
                  <img src={hit.icon_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  hit.title[0]
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-[#FAFAFA] font-medium">{hit.title}</div>
                <div className="text-[9px] text-[#71717A] truncate">{hit.description}</div>
                <div className="flex gap-2 mt-0.5 text-[8px] text-[#52525B]">
                  <span>{hit.author}</span>
                  <span>·</span>
                  <span>{formatDownloads(hit.downloads)} downloads</span>
                </div>
              </div>
              {currentProject && (
                <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                  hit.versions.includes(currentProject.mc_version)
                    ? 'text-[#22C55E] bg-[#22C55E11]'
                    : 'text-[#EF4444] bg-[#EF444411]'
                }`}>
                  {currentProject.mc_version}
                </span>
              )}
              <button
                onClick={() => handleAdd(hit)}
                className="px-2.5 py-1 bg-[#D4A017] text-[#09090B] text-[9px] font-semibold rounded hover:bg-[#FFCC66] transition-colors duration-100"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
