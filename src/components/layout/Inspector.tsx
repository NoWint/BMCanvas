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
      <aside className="w-[320px] h-full bg-white border-l border-[#C6C6C8] flex items-center justify-center">
        <p className="text-[#AEAEB2] text-sm">Select a mod to inspect</p>
      </aside>
    );
  }

  return (
    <aside className="w-[320px] h-full bg-white border-l border-[#C6C6C8] overflow-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#1C1C1E] truncate" style={{ fontFamily: '"SF Pro Display", "Inter Tight", system-ui, sans-serif' }}>
            {selectedMod.name}
          </h3>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="text-[#AEAEB2] hover:text-[#1C1C1E] transition-colors"
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
              <span className="text-[#AEAEB2]">Version</span>
              <p className="text-[#1C1C1E] font-mono">{selectedMod.version_number}</p>
            </div>
          )}
          {selectedMod.author && (
            <div>
              <span className="text-[#AEAEB2]">Author</span>
              <p className="text-[#1C1C1E]">{selectedMod.author}</p>
            </div>
          )}
          {selectedMod.description && (
            <div>
              <span className="text-[#AEAEB2]">Description</span>
              <p className="text-[#1C1C1E]">{selectedMod.description}</p>
            </div>
          )}
          {selectedMod.license && (
            <div>
              <span className="text-[#AEAEB2]">License</span>
              <p className="text-[#1C1C1E]">{selectedMod.license}</p>
            </div>
          )}
          {selectedMod.source_url && (
            <div>
              <span className="text-[#AEAEB2]">Source</span>
              <a
                href={selectedMod.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#007AFF] hover:underline"
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
