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
    return <p className="text-text-secondary text-sm mt-4">Searching...</p>;
  }

  if (error) {
    return <p className="text-danger text-sm mt-4">Search failed: {String(error)}</p>;
  }

  if (!data || data.hits.length === 0) {
    return <p className="text-text-secondary text-sm mt-4">No results found</p>;
  }

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs text-text-tertiary">{data.total_hits} results</p>
      {data.hits.map((hit) => (
        <div
          key={hit.project_id}
          className="bg-surface rounded-xl p-4 shadow-sm border border-separator/50 flex items-start gap-3"
        >
          {hit.icon_url ? (
            <img src={hit.icon_url} alt={hit.title} className="w-10 h-10 rounded-lg flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-text-tertiary flex-shrink-0">?</div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-text-primary text-sm truncate">{hit.title}</h3>
            <p className="text-xs text-text-secondary mt-0.5">by {hit.author ?? 'Unknown'}</p>
            {hit.description && (
              <p className="text-xs text-text-tertiary mt-1 line-clamp-2">{hit.description}</p>
            )}
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {hit.loaders.slice(0, 3).map((l) => (
                <span key={l} className="text-[10px] px-1.5 py-0.5 bg-background rounded text-text-secondary">{l}</span>
              ))}
              <span className="text-[10px] px-1.5 py-0.5 bg-background rounded text-text-secondary">
                {hit.downloads?.toLocaleString() ?? 0} downloads
              </span>
            </div>
          </div>
          <button
            onClick={() => handleAdd(hit)}
            disabled={isModAdded(hit)}
            className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-lg hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 flex-shrink-0"
          >
            {isModAdded(hit) ? 'Added' : 'Add'}
          </button>
        </div>
      ))}
    </div>
  );
}
