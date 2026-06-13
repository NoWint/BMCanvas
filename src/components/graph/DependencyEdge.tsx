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
        stroke: props.selected ? '#86868b' : '#48484a',
        strokeWidth: props.selected ? 2 : 1.5,
        transition: 'stroke 300ms ease-out, stroke-width 300ms ease-out',
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
        stroke: props.selected ? '#86868b' : '#3a3a3c',
        strokeWidth: props.selected ? 1.5 : 1,
        strokeDasharray: '4 3',
        transition: 'stroke 300ms ease-out, stroke-width 300ms ease-out',
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
          stroke: '#ff453a',
          strokeWidth: props.selected ? 2 : 1.5,
          strokeDasharray: '6 4',
          transition: 'stroke-width 300ms ease-out',
        }}
      />
      <text
        x={(props.sourceX + props.targetX) / 2}
        y={(props.sourceY + props.targetY) / 2 - 6}
        textAnchor="middle"
        fontSize={10}
        fill="#ff453a"
      >
        ⚠
      </text>
    </g>
  );
}

export const RequiredEdgeComponent = memo(RequiredEdge);
export const OptionalEdgeComponent = memo(OptionalEdge);
export const ConflictEdgeComponent = memo(ConflictEdge);
