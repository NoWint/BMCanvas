import { X, Globe, Code, Scale } from '@phosphor-icons/react';
import { useUiStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';

export function Inspector() {
  const inspectorOpen = useUiStore((s) => s.inspectorOpen);
  const selectedNodeId = useUiStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useUiStore((s) => s.setSelectedNodeId);
  const mods = useProjectStore((s) => s.mods);

  const selectedMod = selectedNodeId
    ? mods.find((m) => m.id === selectedNodeId)
    : null;

  if (!inspectorOpen || !selectedMod) {
    return (
      <aside className="w-80 h-full bg-surface border-l border-separator flex items-center justify-center">
        <p className="text-text-tertiary text-xs">Select a mod to inspect</p>
      </aside>
    );
  }

  return (
    <aside className="w-80 h-full bg-surface border-l border-separator overflow-auto">
      <div className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            {selectedMod.icon_url ? (
              <img
                src={selectedMod.icon_url}
                alt={selectedMod.name}
                className="w-10 h-10 rounded-lg"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center text-accent font-heading font-bold text-sm">
                {selectedMod.name[0]}
              </div>
            )}
            <div>
              <h3 className="text-sm font-heading font-semibold text-text-primary">
                {selectedMod.name}
              </h3>
              {selectedMod.version_number && (
                <p className="text-[11px] font-mono text-text-tertiary">{selectedMod.version_number}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="text-text-tertiary hover:text-text-primary transition-colors p-1"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4 text-[13px]">
          {selectedMod.author && (
            <div>
              <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-mono">Author</span>
              <p className="text-text-primary mt-0.5">{selectedMod.author}</p>
            </div>
          )}
          {selectedMod.description && (
            <div>
              <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-mono">Description</span>
              <p className="text-text-secondary mt-0.5 leading-relaxed">{selectedMod.description}</p>
            </div>
          )}
          {selectedMod.license && (
            <div className="flex items-center gap-2">
              <Scale size={14} className="text-text-tertiary" />
              <span className="text-text-secondary">{selectedMod.license}</span>
            </div>
          )}
          {selectedMod.source_url && (
            <div className="flex items-center gap-2">
              <Code size={14} className="text-text-tertiary" />
              <a
                href={selectedMod.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-info hover:underline truncate"
              >
                Source
              </a>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
