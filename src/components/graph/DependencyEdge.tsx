import { BaseEdge, getSmoothStepPath } from 'reactflow';
import type { EdgeProps } from 'reactflow';

export function DependencyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  const depType = data?.depType as string | undefined;
  const isIncompatible = depType === 'incompatible';
  const isOptional = depType === 'optional';

  let stroke = '#8E8E93';
  let strokeDasharray = '';
  let strokeWidth = 1.5;

  if (isIncompatible) {
    stroke = '#FF3B30';
    strokeDasharray = '6 3';
    strokeWidth = 2;
  } else if (isOptional) {
    stroke = '#AEAEB2';
    strokeDasharray = '4 4';
  }

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke,
        strokeWidth: selected ? strokeWidth + 1 : strokeWidth,
        strokeDasharray,
      }}
    />
  );
}
