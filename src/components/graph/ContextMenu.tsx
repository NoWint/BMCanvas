import { useTranslation } from 'react-i18next';
import { useGraphStore } from '../../stores/graphStore';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';

interface ContextMenuProps {
  nodeId: string;
  x: number;
  y: number;
}

export function ContextMenu({ nodeId, x, y }: ContextMenuProps) {
  const { t } = useTranslation();
  const { toggleCollapse, collapsedNodes, setHighlighted, setContextMenu } = useGraphStore();
  const { removeMod } = useProjectStore();
  const { openInspector } = useUIStore();
  const isCollapsed = collapsedNodes.has(nodeId);

  const handleViewDetails = () => {
    openInspector(nodeId);
    setContextMenu(null);
  };

  const handleViewDependencyChain = () => {
    // Highlight path from this node to root (trace upstream)
    const { nodes, edges } = useGraphStore.getState();
    const pathNodeIds = new Set<string>();
    pathNodeIds.add(nodeId);

    // Trace upstream: from this node, follow edges where target === current node
    let current = new Set([nodeId]);
    while (current.size > 0) {
      const next = new Set<string>();
      for (const edge of edges) {
        if (current.has(edge.target) && !pathNodeIds.has(edge.source)) {
          pathNodeIds.add(edge.source);
          next.add(edge.source);
        }
      }
      current = next;
    }

    setHighlighted(pathNodeIds);
    setContextMenu(null);
  };

  const handleRemoveMod = async () => {
    await removeMod(nodeId);
    setContextMenu(null);
  };

  const handleToggleCollapse = () => {
    toggleCollapse(nodeId);
    setContextMenu(null);
  };

  const menuItems = [
    { label: t('contextMenu.viewDetails'), action: handleViewDetails, icon: '📋' },
    { label: t('contextMenu.viewDependencyChain'), action: handleViewDependencyChain, icon: '🔗' },
    { label: isCollapsed ? t('contextMenu.expandSubtree') : t('contextMenu.collapseSubtree'), action: handleToggleCollapse, icon: isCollapsed ? '▾' : '▸' },
    { label: t('contextMenu.removeMod'), action: handleRemoveMod, icon: '🗑️', danger: true },
  ];

  return (
    <div
      className="fixed z-50 py-1.5 rounded-xl overflow-hidden animate-scale-in"
      style={{
        left: x,
        top: y,
        background: 'rgba(44,44,46,0.95)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        minWidth: '180px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, i) => (
        <button
          key={i}
          onClick={item.action}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors duration-100 hover:bg-[rgba(255,255,255,0.08)]"
          style={{ color: (item as any).danger ? '#ff453a' : '#f5f5f7' }}
        >
          <span className="text-[14px] w-5 text-center">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
