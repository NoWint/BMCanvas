import { useUiStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import type { ViewType } from '../../types';

const NAV_ITEMS: { key: ViewType; label: string; icon: string }[] = [
  { key: 'projects', label: 'Projects', icon: '📁' },
  { key: 'discover', label: 'Discover', icon: '🔍' },
  { key: 'graph', label: 'Graph', icon: '🔗' },
  { key: 'diagnostics', label: 'Diagnostics', icon: '⚠️' },
  { key: 'export', label: 'Export', icon: '📦' },
];

export function Sidebar() {
  const activeView = useUiStore((s) => s.activeView);
  const setActiveView = useUiStore((s) => s.setActiveView);
  const currentProject = useProjectStore((s) => s.currentProject);
  const mods = useProjectStore((s) => s.mods);

  return (
    <aside className="w-60 h-full bg-background flex flex-col border-r border-separator">
      <div className="px-5 py-4 border-b border-separator">
        <h1 className="text-lg font-bold text-text-primary tracking-tight font-heading">
          ModCanvas
        </h1>
        <p className="text-xs text-text-tertiary mt-0.5">Design Modpacks Visually</p>
      </div>

      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveView(item.key)}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors duration-150
              ${activeView === item.key
                ? 'bg-surface text-accent font-medium shadow-sm'
                : 'text-text-secondary hover:bg-surface/60 hover:text-text-primary'
              }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {currentProject && (
        <div className="px-5 py-3 border-t border-separator bg-surface">
          <p className="text-xs text-text-tertiary uppercase tracking-wider">Current Project</p>
          <p className="text-sm font-medium text-text-primary mt-1 truncate">{currentProject.name}</p>
          <p className="text-xs text-text-secondary mt-0.5">
            {currentProject.mc_version} · {currentProject.loader} · {mods.length} mods
          </p>
        </div>
      )}
    </aside>
  );
}
