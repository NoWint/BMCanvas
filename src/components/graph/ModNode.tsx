import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { ModNodeData, NodeType } from '../../types';

const NODE_COLORS: Record<NodeType, { border: string; bg: string; text: string; label: string }> = {
  mod: { border: '#D4A017', bg: '#D4A01711', text: '#D4A017', label: 'MOD' },
  library: { border: '#3B82F6', bg: '#3B82F611', text: '#3B82F6', label: 'LIB' },
  api: { border: '#8B5CF6', bg: '#8B5CF611', text: '#8B5CF6', label: 'API' },
  loader: { border: '#22C55E', bg: '#22C55E11', text: '#22C55E', label: 'LOADER' },
};

function ModNodeComponent({ data, selected }: NodeProps<ModNodeData>) {
  const colors = NODE_COLORS[data.nodeType];
  const isConflict = data.hasConflict;

  return (
    <div
      className={`
        relative min-w-[200px] rounded-md border bg-[#18181B] p-2.5
        transition-all duration-150
        ${selected ? 'ring-2 ring-offset-1 ring-offset-[#09090B]' : ''}
        ${isConflict ? 'animate-danger-pulse' : selected ? 'animate-pulse-glow' : ''}
      `}
      style={{
        borderLeftWidth: '3px',
        borderLeftColor: isConflict ? '#EF4444' : colors.border,
        borderColor: isConflict ? '#EF444466' : selected ? colors.border : '#27272A',
        boxShadow: selected ? `0 0 12px ${colors.border}33` : undefined,
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

      <div className="mt-1 text-[12px] font-medium text-[#FAFAFA] leading-tight">{data.name}</div>

      <div className="mt-0.5 text-[8px] text-[#71717A]">
        {data.dependencyCount > 0 ? `${data.dependencyCount} dependencies` : data.nodeType === 'loader' ? 'platform' : 'no dependencies'}
      </div>
    </div>
  );
}

export const ModNode = memo(ModNodeComponent);
