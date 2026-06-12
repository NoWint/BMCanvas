import { Plus, Check, DownloadSimple } from '@phosphor-icons/react';
import { useModSearch } from '../../hooks/useModrinth';
import { useProjectStore } from '../../stores/projectStore';
import type { ModrinthSearchHit } from '../../types';

interface SearchResultsProps {
  query: string;
}

export function SearchResults({ query }: SearchResultsProps) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const addMod = useProjectStore((s) => s.addMod);
  const mods = useProjectStore((s) => s.mods);

  const loaders = currentProject ? [currentProject.loader] : undefined;
  const gameVersions = currentProject ? [currentProject.mc_version] : undefined;

  const { data, isLoading, error } = useModSearch(query, loaders, gameVersions);

  const isModAdded = (hit: ModrinthSearchHit) =>
    mods.some((m) => m.modrinth_id === hit.project_id);

  const handleAdd = async (hit: ModrinthSearchHit) => {
    await addMod({
      modrinth_id: hit.project_id,
      slug: hit.slug ?? null,
      name: hit.title,
      version_id: null,
      version_number: null,
      icon_url: hit.icon_url ?? null,
      description: hit.description ?? null,
      author: hit.author ?? null,
      source_url: null,
      license: null,
    });
  };

  if (!query) return null;

  if (isLoading) {
    return (
      <div className="mt-6 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface rounded-lg p-4 border border-separator animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-elevated" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-elevated rounded" />
                <div className="h-3 w-48 bg-elevated rounded mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-danger text-sm mt-4">Search failed: {String(error)}</p>;
  }

  if (!data || data.hits.length === 0) {
    return <p className="text-text-tertiary text-sm mt-4">No results found</p>;
  }

  return (
    <div className="mt-6">
      <p className="text-[11px] font-mono text-text-tertiary mb-3">{data.total_hits} results</p>
      <div className="space-y-1.5">
        {data.hits.map((hit) => {
          const added = isModAdded(hit);
          return (
            <div
              key={hit.project_id}
              className="bg-surface rounded-lg p-3.5 border border-separator hover:border-separator hover:bg-elevated/50 transition-all duration-150 flex items-start gap-3 group"
            >
              {hit.icon_url ? (
                <img src={hit.icon_url} alt={hit.title} className="w-9 h-9 rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-elevated flex items-center justify-center text-text-tertiary text-xs font-heading font-bold flex-shrink-0">
                  {hit.title[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-text-primary text-sm truncate">{hit.title}</h3>
                <p className="text-[11px] text-text-tertiary mt-0.5">by {hit.author ?? 'Unknown'}</p>
                {hit.description && (
                  <p className="text-xs text-text-tertiary mt-1 line-clamp-1">{hit.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {hit.loaders.slice(0, 3).map((l) => (
                    <span key={l} className="text-[10px] font-mono px-1.5 py-0.5 bg-elevated rounded text-text-tertiary">{l}</span>
                  ))}
                  <span className="text-[10px] font-mono text-text-tertiary flex items-center gap-1">
                    <DownloadSimple size={10} />
                    {(hit.downloads ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleAdd(hit)}
                disabled={added}
                className={`p-2 rounded-md transition-all duration-150 flex-shrink-0 active:scale-[0.95]
                  ${added
                    ? 'bg-success/10 text-success'
                    : 'bg-accent/10 text-accent hover:bg-accent/20'
                  }`}
              >
                {added ? <Check size={14} weight="bold" /> : <Plus size={14} weight="bold" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
