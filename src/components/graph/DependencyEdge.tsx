import { memo } from 'react';
import { BaseEdge, getSmoothStepPath, type EdgeProps } from 'reactflow';

function RequiredEdge(props: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 8,
  });

  return (
    <BaseEdge
      id={props.id}
      path={edgePath}
      style={{
        stroke: props.selected ? '#A1A1AA' : '#52525B',
        strokeWidth: props.selected ? 2 : 1.5,
        transition: 'stroke 150ms, stroke-width 150ms',
      }}
    />
  );
}

function OptionalEdge(props: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 8,
  });

  return (
    <BaseEdge
      id={props.id}
      path={edgePath}
      style={{
        stroke: props.selected ? '#71717A' : '#3F3F46',
        strokeWidth: props.selected ? 1.5 : 1,
        strokeDasharray: '4 3',
        transition: 'stroke 150ms, stroke-width 150ms',
      }}
    />
  );
}

function ConflictEdge(props: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 8,
  });

  return (
    <g>
      <BaseEdge
        id={props.id}
        path={edgePath}
        style={{
          stroke: '#EF4444',
          strokeWidth: props.selected ? 2 : 1.5,
          strokeDasharray: '6 4',
          transition: 'stroke-width 150ms',
        }}
      />
      <text
        x={(props.sourceX + props.targetX) / 2}
        y={(props.sourceY + props.targetY) / 2 - 6}
        textAnchor="middle"
        fontSize={10}
        fill="#EF4444"
      >
        ⚠
      </text>
    </g>
  );
}

export const RequiredEdgeComponent = memo(RequiredEdge);
export const OptionalEdgeComponent = memo(OptionalEdge);
export const ConflictEdgeComponent = memo(ConflictEdge);
