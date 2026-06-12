import { MagnifyingGlass, Plus, Minus, ArrowsOut } from '@phosphor-icons/react';
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
    <div className="absolute bottom-4 left-4 flex items-center gap-1.5 z-10">
      <form onSubmit={handleSearch} className="flex items-center gap-1">
        <div className="relative">
          <MagnifyingGlass size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search node..."
            className="pl-7 pr-2 py-1.5 bg-surface/90 backdrop-blur-sm rounded-md border border-sep text-primary text-[11px] focus:outline-none focus:border-accent transition-colors w-32"
          />
        </div>
      </form>
      <button
        onClick={() => fitView({ padding: 0.2 })}
        className="p-1.5 bg-surface/90 backdrop-blur-sm rounded-md border border-sep text-muted hover:text-primary hover:border-accent/30 transition-colors"
        title="Fit view"
      >
        <ArrowsOut size={14} />
      </button>
      <button
        onClick={() => zoomIn()}
        className="p-1.5 bg-surface/90 backdrop-blur-sm rounded-md border border-sep text-muted hover:text-primary hover:border-accent/30 transition-colors"
        title="Zoom in"
      >
        <Plus size={14} />
      </button>
      <button
        onClick={() => zoomOut()}
        className="p-1.5 bg-surface/90 backdrop-blur-sm rounded-md border border-sep text-muted hover:text-primary hover:border-accent/30 transition-colors"
        title="Zoom out"
      >
        <Minus size={14} />
      </button>
    </div>
  );
}
