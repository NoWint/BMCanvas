import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';
import type { ModNodeData } from '../types';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 72;

export function computeLayout(
  nodes: Node<ModNodeData>[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR'
): Node<ModNodeData>[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 140 });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });
}
