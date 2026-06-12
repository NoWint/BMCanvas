import { useReactFlow } from 'reactflow';
import { useGraphStore } from '../../stores/graphStore';

export function GraphControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const searchQuery = useGraphStore((s) => s.searchQuery);
  const setSearchQuery = useGraphStore((s) => s.setSearchQuery);
  const nodes = useGraphStore((s) => s.nodes);
  const focusNode = useGraphStore((s) => s.focusNode);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = nodes.find((n) =>
      (n.data as any).name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (match) {
      focusNode(match.id);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
      <form onSubmit={handleSearch} className="flex items-center gap-1">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search node..."
          className="px-3 py-1.5 bg-surface rounded-lg border border-separator text-text-primary text-xs focus:outline-none focus:border-accent transition-colors w-40"
        />
        <button
          type="submit"
          className="px-2 py-1.5 bg-surface rounded-lg border border-separator text-text-secondary text-xs hover:bg-background transition-colors"
        >
          Find
        </button>
      </form>
      <button
        onClick={() => fitView({ padding: 0.2 })}
        className="px-2 py-1.5 bg-surface rounded-lg border border-separator text-text-secondary text-xs hover:bg-background transition-colors"
      >
        Fit
      </button>
      <button
        onClick={() => zoomIn()}
        className="px-2 py-1.5 bg-surface rounded-lg border border-separator text-text-secondary text-xs hover:bg-background transition-colors"
      >
        +
      </button>
      <button
        onClick={() => zoomOut()}
        className="px-2 py-1.5 bg-surface rounded-lg border border-separator text-text-secondary text-xs hover:bg-background transition-colors"
      >
        −
      </button>
    </div>
  );
}
