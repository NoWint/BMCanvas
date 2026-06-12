import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { ModNodeData } from '../../types';

const NODE_STYLES: Record<string, { border: string; bg: string; dot: string; label: string }> = {
  mod: { border: '#D4A01733', bg: '#D4A01708', dot: '#D4A017', label: 'MOD' },
  library: { border: '#3B82F633', bg: '#3B82F608', dot: '#3B82F6', label: 'LIB' },
  api: { border: '#8B5CF633', bg: '#8B5CF608', dot: '#8B5CF6', label: 'API' },
  loader: { border: '#22C55E33', bg: '#22C55E08', dot: '#22C55E', label: 'LOADER' },
};

export function ModNode({ data, selected }: NodeProps<ModNodeData>) {
  const style = NODE_STYLES[data.nodeType] || NODE_STYLES.mod;

  return (
    <div
      className={`rounded-lg transition-all duration-150
        ${selected ? 'ring-1 ring-accent/40' : ''}
        ${data.hasConflict ? 'ring-1 ring-danger/60' : ''}`}
      style={{
        background: style.bg,
        border: `1px solid ${selected ? style.dot : style.border}`,
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !bg-muted !border-0" />

      <div className="px-3 py-2 min-w-[180px]">
        <div className="flex items-center gap-2">
          {data.iconUrl ? (
            <img src={data.iconUrl} alt="" className="w-5 h-5 rounded flex-shrink-0" />
          ) : (
            <div
              className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[8px] text-bg font-bold"
              style={{ backgroundColor: style.dot }}
            >
              {style.label[0]}
            </div>
          )}
          <span className="text-xs font-medium text-primary truncate">{data.name}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {data.version && (
            <span className="text-[10px] font-mono text-muted">{data.version}</span>
          )}
          <span
            className="text-[8px] font-mono font-bold px-1 py-px rounded text-bg"
            style={{ backgroundColor: style.dot }}
          >
            {style.label}
          </span>
          {data.collapsed && data.dependencyCount > 0 && (
            <span className="text-[10px] font-mono px-1 py-px bg-elevated rounded text-muted">
              +{data.dependencyCount}
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !bg-muted !border-0" />
    </div>
  );
}
