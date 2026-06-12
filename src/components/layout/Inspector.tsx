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
        <p className="text-text-tertiary text-sm">Select a mod to inspect</p>
      </aside>
    );
  }

  return (
    <aside className="w-80 h-full bg-surface border-l border-separator overflow-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary truncate font-heading">
            {selectedMod.name}
          </h3>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {selectedMod.icon_url && (
          <img
            src={selectedMod.icon_url}
            alt={selectedMod.name}
            className="w-16 h-16 rounded-lg mb-3"
          />
        )}

        <div className="space-y-3 text-sm">
          {selectedMod.version_number && (
            <div>
              <span className="text-text-tertiary">Version</span>
              <p className="text-text-primary font-mono">{selectedMod.version_number}</p>
            </div>
          )}
          {selectedMod.author && (
            <div>
              <span className="text-text-tertiary">Author</span>
              <p className="text-text-primary">{selectedMod.author}</p>
            </div>
          )}
          {selectedMod.description && (
            <div>
              <span className="text-text-tertiary">Description</span>
              <p className="text-text-primary">{selectedMod.description}</p>
            </div>
          )}
          {selectedMod.license && (
            <div>
              <span className="text-text-tertiary">License</span>
              <p className="text-text-primary">{selectedMod.license}</p>
            </div>
          )}
          {selectedMod.source_url && (
            <div>
              <span className="text-text-tertiary">Source</span>
              <a
                href={selectedMod.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-info hover:underline"
              >
                {selectedMod.source_url}
              </a>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
