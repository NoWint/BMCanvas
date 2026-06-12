import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { getNodeType } from '../../engine/dependencyResolver';
import type { NodeType } from '../../types';

const NODE_COLORS: Record<NodeType, string> = {
  mod: '#D4A017',
  library: '#3B82F6',
  api: '#8B5CF6',
  loader: '#22C55E',
};

export function ModListPanel() {
  const { currentProject, mods, removeMod, projects, selectProject } = useProjectStore();
  const { openInspector, setSelectedNode, togglePanel, showWelcome } = useUIStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  if (!currentProject) return null;

  const handleModClick = (modId: string) => {
    setSelectedNode(modId);
    openInspector(modId);
  };

  const handleRemoveMod = async (modId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeMod(modId);
  };

  const handleSwitchProject = async (projectId: string) => {
    setDropdownOpen(false);
    if (projectId !== currentProject.id) {
      await selectProject(projectId);
    }
  };

  const handleBackToProjects = () => {
    setDropdownOpen(false);
    showWelcome();
  };

  return (
    <div className="w-[240px] bg-[#0C0C0E] border-r border-[#1E1E22] flex flex-col shrink-0">
      {/* Project switcher */}
      <div className="p-3 border-b border-[#1E1E22] relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center gap-2 bg-[#18181B] rounded-md px-2.5 py-2 hover:bg-[#1E1E22] transition-colors duration-100"
        >
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[11px] text-[#FAFAFA] font-medium">{currentProject.name}</div>
            <div className="text-[8px] text-[#52525B] mt-0.5">
              {currentProject.mc_version} · {currentProject.loader}
            </div>
          </div>
          <span className={`text-[8px] text-[#52525B] transition-transform duration-100 ${dropdownOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-[#18181B] border border-[#1E1E22] rounded-md shadow-xl z-50 overflow-hidden">
            {/* Back to all projects */}
            <button
              onClick={handleBackToProjects}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] text-[#D4A017] hover:bg-[#1E1E22] transition-colors duration-100 border-b border-[#1E1E22]"
            >
              <span>←</span>
              <span>All Projects</span>
            </button>

            {/* Project list */}
            <div className="max-h-[200px] overflow-y-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSwitchProject(project.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 transition-colors duration-100 ${
                    project.id === currentProject.id
                      ? 'bg-[#1E1E22] text-[#D4A017]'
                      : 'text-[#FAFAFA] hover:bg-[#1E1E22]'
                  }`}
                >
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[10px] font-medium truncate">{project.name}</div>
                    <div className="text-[8px] text-[#52525B]">{project.mc_version} · {project.loader}</div>
                  </div>
                  {project.id === currentProject.id && (
                    <span className="text-[8px] text-[#D4A017]">●</span>
                  )}
                </button>
              ))}
            </div>

            {/* New project */}
            <button
              onClick={() => { setDropdownOpen(false); showWelcome(); }}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] text-[#52525B] hover:text-[#71717A] hover:bg-[#1E1E22] transition-colors duration-100 border-t border-[#1E1E22]"
            >
              <span className="text-[#D4A017]">+</span>
              <span>New Project</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1">
          <div className="text-[8px] text-[#52525B] uppercase tracking-wider">Mods ({mods.length})</div>
        </div>
        <div className="px-1.5">
          {mods.map((mod) => {
            const nodeType = getNodeType(mod);
            const color = NODE_COLORS[nodeType];
            return (
              <div
                key={mod.id}
                onClick={() => handleModClick(mod.id)}
                className="group flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer hover:bg-[#18181B] transition-colors duration-100"
              >
                <div
                  className="w-[3px] h-4 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#FAFAFA] truncate">{mod.name}</div>
                  <div className="text-[7px] text-[#52525B] font-mono">{mod.version_number ?? '—'}</div>
                </div>
                <button
                  onClick={(e) => handleRemoveMod(mod.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-[#3F3F46] hover:text-[#EF4444] transition-all duration-100 text-[10px]"
                  title="Remove mod"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-2 border-t border-[#1E1E22]">
        <button
          onClick={() => togglePanel('search')}
          className="w-full flex items-center gap-2 px-2.5 py-2 bg-[#18181B] rounded-md text-[10px] text-[#71717A] hover:text-[#D4A017] hover:bg-[#18181B] transition-colors duration-100"
        >
          <span className="text-[#D4A017]">+</span>
          <span>Add Mod</span>
          <kbd className="ml-auto text-[7px] font-mono text-[#3F3F46] bg-[#09090B] px-1 py-0.5 rounded">⌘K</kbd>
        </button>
      </div>
    </div>
  );
}
