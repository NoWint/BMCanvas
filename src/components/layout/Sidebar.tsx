import {
  FolderSimple,
  MagnifyingGlass,
  Graph,
  Warning,
  PackageExport,
} from '@phosphor-icons/react';
import { useUiStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import type { ViewType } from '../../types';

const NAV_ITEMS: { key: ViewType; label: string; Icon: typeof FolderSimple }[] = [
  { key: 'projects', label: 'Projects', Icon: FolderSimple },
  { key: 'discover', label: 'Discover', Icon: MagnifyingGlass },
  { key: 'graph', label: 'Graph', Icon: Graph },
  { key: 'diagnostics', label: 'Diagnostics', Icon: Warning },
  { key: 'export', label: 'Export', Icon: PackageExport },
];

export function Sidebar() {
  const activeView = useUiStore((s) => s.activeView);
  const setActiveView = useUiStore((s) => s.setActiveView);
  const currentProject = useProjectStore((s) => s.currentProject);
  const mods = useProjectStore((s) => s.mods);

  return (
    <aside className="w-60 h-full bg-surface flex flex-col border-r border-separator">
      <div className="px-5 pt-5 pb-4">
        <h1 className="text-base font-heading font-bold text-text-primary tracking-tight">
          ModCanvas
        </h1>
        <p className="text-[11px] text-text-tertiary mt-0.5 font-mono">
          v0.1.0
        </p>
      </div>

      <nav className="flex-1 px-2 py-1">
        {NAV_ITEMS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveView(key)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-150
              ${activeView === key
                ? 'bg-elevated text-accent font-medium'
                : 'text-text-secondary hover:bg-elevated/60 hover:text-text-primary'
              }`}
          >
            <Icon size={18} weight={activeView === key ? 'fill' : 'regular'} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {currentProject && (
        <div className="mx-3 mb-3 p-3 bg-elevated rounded-lg border border-separator">
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-mono">Active</p>
          <p className="text-[13px] font-medium text-text-primary mt-1 truncate">{currentProject.name}</p>
          <p className="text-[11px] text-text-tertiary mt-0.5 font-mono">
            {currentProject.mc_version} / {currentProject.loader} / {mods.length} mods
          </p>
        </div>
      )}
    </aside>
  );
}
