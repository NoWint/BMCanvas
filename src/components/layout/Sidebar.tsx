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
    <aside className="w-[240px] h-full bg-[#F2F2F7] flex flex-col border-r border-[#C6C6C8]">
      <div className="px-5 py-4 border-b border-[#C6C6C8]">
        <h1 className="text-lg font-bold text-[#1C1C1E] tracking-tight" style={{ fontFamily: '"SF Pro Display", "Inter Tight", system-ui, sans-serif' }}>
          ModCanvas
        </h1>
        <p className="text-xs text-[#AEAEB2] mt-0.5">Design Modpacks Visually</p>
      </div>

      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveView(item.key)}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors duration-150
              ${activeView === item.key
                ? 'bg-white text-[#D4A017] font-medium shadow-sm'
                : 'text-[#8E8E93] hover:bg-white/60 hover:text-[#1C1C1E]'
              }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {currentProject && (
        <div className="px-5 py-3 border-t border-[#C6C6C8] bg-white">
          <p className="text-xs text-[#AEAEB2] uppercase tracking-wider">Current Project</p>
          <p className="text-sm font-medium text-[#1C1C1E] mt-1 truncate">{currentProject.name}</p>
          <p className="text-xs text-[#8E8E93] mt-0.5">
            {currentProject.mc_version} · {currentProject.loader} · {mods.length} mods
          </p>
        </div>
      )}
    </aside>
  );
}
