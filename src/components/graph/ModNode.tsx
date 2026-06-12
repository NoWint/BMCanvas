import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { ModNodeData } from '../../types';

const NODE_TYPE_COLORS: Record<string, string> = {
  mod: '#D4A017',
  library: '#007AFF',
  api: '#8B5CF6',
  loader: '#34C759',
};

const NODE_TYPE_LABELS: Record<string, string> = {
  mod: 'Mod',
  library: 'Library',
  api: 'API',
  loader: 'Loader',
};

export function ModNode({ data, selected }: NodeProps<ModNodeData>) {
  const borderColor = NODE_TYPE_COLORS[data.nodeType] || '#C6C6C8';
  const typeLabel = NODE_TYPE_LABELS[data.nodeType] || 'Mod';

  return (
    <div
      className={`bg-surface rounded-lg shadow-sm border-l-[3px] transition-shadow duration-150
        ${selected ? 'shadow-md ring-1 ring-accent/30' : 'shadow-sm'}
        ${data.hasConflict ? 'ring-2 ring-danger/50' : ''}`}
      style={{ borderLeftColor: borderColor }}
    >
      <Handle type="target" position={Position.Left} className="!bg-text-tertiary !w-2 !h-2" />

      <div className="px-3 py-2 min-w-[180px]">
        <div className="flex items-center gap-2">
          {data.iconUrl ? (
            <img src={data.iconUrl} alt="" className="w-6 h-6 rounded flex-shrink-0" />
          ) : (
            <div
              className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold"
              style={{ backgroundColor: borderColor }}
            >
              {typeLabel[0]}
            </div>
          )}
          <span className="text-sm font-medium text-text-primary truncate">{data.name}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {data.version && (
            <span className="text-[10px] font-mono text-text-tertiary">{data.version}</span>
          )}
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium"
            style={{ backgroundColor: borderColor }}
          >
            {typeLabel}
          </span>
          {data.collapsed && data.dependencyCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-background rounded text-text-secondary">
              +{data.dependencyCount}
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-text-tertiary !w-2 !h-2" />
    </div>
  );
}
