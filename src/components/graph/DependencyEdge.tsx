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

  let stroke = '#71717A';
  let strokeDasharray = '';
  let strokeWidth = 1;

  if (isIncompatible) {
    stroke = '#EF4444';
    strokeDasharray = '5 3';
    strokeWidth = 1.5;
  } else if (isOptional) {
    stroke = '#52525B';
    strokeDasharray = '3 3';
  }

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke,
        strokeWidth: selected ? strokeWidth + 0.5 : strokeWidth,
        strokeDasharray,
      }}
    />
  );
}
