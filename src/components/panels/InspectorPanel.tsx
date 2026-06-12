import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { getNodeType } from '../../engine/dependencyResolver';
import type { NodeType } from '../../types';

const NODE_COLORS: Record<NodeType, string> = {
  mod: '#D4A017',
  library: '#3B82F6',
  api: '#8B5CF6',
  loader: '#22C55E',
};

const NODE_LABELS: Record<NodeType, string> = {
  mod: 'MOD',
  library: 'LIB',
  api: 'API',
  loader: 'LOADER',
};

export function InspectorPanel() {
  const { mods } = useProjectStore();
  const { selectedNodeId, closeInspector } = useUIStore();

  const mod = mods.find((m) => m.id === selectedNodeId);

  if (!mod) {
    return (
      <div className="w-[320px] bg-[#0C0C0E] border-l border-[#1E1E22] flex items-center justify-center shrink-0">
        <span className="text-[#3F3F46] text-[10px]">Select a mod to inspect</span>
      </div>
    );
  }

  const nodeType = getNodeType(mod);
  const color = NODE_COLORS[nodeType];

  return (
    <div className="w-[320px] bg-[#0C0C0E] border-l border-[#1E1E22] flex flex-col shrink-0 animate-slide-right overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1E1E22]">
        <span className="text-[8px] text-[#52525B] uppercase tracking-wider">Inspector</span>
        <button onClick={closeInspector} className="text-[#3F3F46] hover:text-[#FAFAFA] text-[10px]">✕</button>
      </div>
      <div className="p-3 space-y-4">
        <div className="border-l-2 pl-2.5" style={{ borderColor: color }}>
          <div className="text-[12px] text-[#FAFAFA] font-medium">{mod.name}</div>
          <div className="text-[9px] mt-0.5" style={{ color }}>
            {NODE_LABELS[nodeType]} · {mod.version_number ?? '—'}
          </div>
        </div>
        <InfoField label="Description" value={mod.description} />
        <InfoField label="Author" value={mod.author} />
        <div>
          <div className="text-[8px] text-[#52525B] uppercase tracking-wider mb-1">Dependencies</div>
          <div className="text-[9px] text-[#71717A]">View in graph</div>
        </div>
        <InfoField label="Supported MC Versions" value={mod.supported_mc_versions?.join(', ')} />
        <InfoField label="License" value={mod.license} />
        {mod.source_url && (
          <div>
            <div className="text-[8px] text-[#52525B] uppercase tracking-wider mb-1">Repository</div>
            <a href={mod.source_url} target="_blank" rel="noopener" className="text-[9px] text-[#D4A017] hover:underline break-all">
              {mod.source_url}
            </a>
          </div>
        )}
        {mod.changelog && (
          <div>
            <div className="text-[8px] text-[#52525B] uppercase tracking-wider mb-1">Changelog</div>
            <div className="text-[9px] text-[#71717A] max-h-24 overflow-y-auto whitespace-pre-wrap">{mod.changelog}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[8px] text-[#52525B] uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-[9px] text-[#A1A1AA] leading-relaxed">{value}</div>
    </div>
  );
}
