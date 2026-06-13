import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { ModNodeData, NodeType } from '../../types';

const NODE_COLORS: Record<NodeType, { border: string; bg: string; text: string; label: string }> = {
  mod: { border: '#ff9f0a', bg: '#ff9f0a11', text: '#ff9f0a', label: 'MOD' },
  library: { border: '#0a84ff', bg: '#0a84ff11', text: '#0a84ff', label: 'LIB' },
  api: { border: '#bf5af2', bg: '#bf5af211', text: '#bf5af2', label: 'API' },
  loader: { border: '#30d158', bg: '#30d15811', text: '#30d158', label: 'LOADER' },
};

function ModNodeComponent({ data, selected }: NodeProps<ModNodeData>) {
  const colors = NODE_COLORS[data.nodeType];
  const isConflict = data.hasConflict;

  return (
    <div
      className={`
        relative min-w-[200px] p-2.5
        transition-all duration-300
        ${isConflict ? 'animate-danger-pulse' : ''}
      `}
      style={{
        background: 'rgba(44,44,46,0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '12px',
        borderLeftWidth: '3px',
        borderLeftColor: isConflict ? '#EF4444' : colors.border,
        border: `1px solid ${isConflict ? '#EF444466' : selected ? colors.border : 'rgba(255,255,255,0.08)'}`,
        borderLeftWidth: '3px',
        borderLeftColor: isConflict ? '#EF4444' : colors.border,
        boxShadow: selected ? `0 0 20px rgba(10,132,255,0.15)` : undefined,
        transform: undefined as any,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-[#52525B] !w-1.5 !h-1.5 !border-none" />
      <Handle type="source" position={Position.Right} className="!bg-[#52525B] !w-1.5 !h-1.5 !border-none" />

      <div className="flex items-center gap-1.5">
        <span
          className="text-[9px] font-semibold uppercase tracking-wider"
          style={{ color: isConflict ? '#EF4444' : colors.text }}
        >
          {colors.label}
        </span>
        {data.version && (
          <span className="ml-auto text-[8px] text-[#52525B] font-mono">{data.version}</span>
        )}
        {isConflict && (
          <span className="ml-auto text-[8px] text-[#EF4444] font-semibold">⚠ CONFLICT</span>
        )}
      </div>

      <div className="mt-1 text-[12px] font-medium text-[#FAFAFA] leading-tight flex items-center gap-1.5">
        <span>{data.name}</span>
        {data.collapsed && (
          <span className="inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.border}22`, color: colors.text }}>
            <span>▸</span>
            <span>+{data.collapsedDepCount ?? 0} deps</span>
          </span>
        )}
      </div>

      <div className="mt-0.5 text-[8px] text-[#71717A]">
        {data.dependencyCount > 0 ? `${data.dependencyCount} dependencies` : data.nodeType === 'loader' ? 'platform' : 'no dependencies'}
      </div>
    </div>
  );
}

export const ModNode = memo(ModNodeComponent);
