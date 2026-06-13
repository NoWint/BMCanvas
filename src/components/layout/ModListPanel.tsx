import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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

const NODE_LABELS: Record<NodeType, string> = {
  mod: 'MOD',
  library: 'LIB',
  api: 'API',
  loader: 'LOADER',
};

export function ModListPanel() {
  const { t } = useTranslation();
  const { currentProject, mods, removeMod, projects, selectProject } = useProjectStore();
  const { openInspector, setSelectedNode, togglePanel, showWelcome } = useUIStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedModIds, setSelectedModIds] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
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

  // Clear selection when project changes
  useEffect(() => {
    setSelectedModIds(new Set());
    setFilterQuery('');
  }, [currentProject?.id]);

  if (!currentProject) return null;

  const filteredMods = filterQuery
    ? mods.filter(m => m.name.toLowerCase().includes(filterQuery.toLowerCase()))
    : mods;

  const handleModClick = (modId: string, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedId) {
      // Shift+click: range select
      const ids = filteredMods.map(m => m.id);
      const startIdx = ids.indexOf(lastClickedId);
      const endIdx = ids.indexOf(modId);
      if (startIdx !== -1 && endIdx !== -1) {
        const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        const rangeIds = ids.slice(from, to + 1);
        setSelectedModIds(prev => {
          const next = new Set(prev);
          rangeIds.forEach(id => next.add(id));
          return next;
        });
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd+click: toggle selection
      setSelectedModIds(prev => {
        const next = new Set(prev);
        if (next.has(modId)) {
          next.delete(modId);
        } else {
          next.add(modId);
        }
        return next;
      });
    } else {
      // Regular click: single select
      setSelectedModIds(new Set([modId]));
      setSelectedNode(modId);
      openInspector(modId);
    }
    setLastClickedId(modId);
  };

  const handleRemoveMod = async (modId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeMod(modId);
    setSelectedModIds(prev => {
      const next = new Set(prev);
      next.delete(modId);
      return next;
    });
  };

  const handleBatchDelete = async () => {
    for (const modId of selectedModIds) {
      await removeMod(modId);
    }
    setSelectedModIds(new Set());
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
    <div className="w-[240px] bg-[#0C0C0E]/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col shrink-0">
      {/* Project switcher */}
      <div className="p-3 border-b border-white/[0.06] relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg px-2.5 py-2 transition-colors duration-150"
        >
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[11px] text-[#FAFAFA] font-medium">{currentProject.name}</div>
            <div className="text-[8px] text-[#86868b] mt-0.5">
              {currentProject.mc_version} · {currentProject.loader}
            </div>
          </div>
          <span className={`text-[8px] text-[#86868b] transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-[#1C1C1E]/95 backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-2xl z-50 overflow-hidden">
            {/* Back to all projects */}
            <button
              onClick={handleBackToProjects}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] text-[#D4A017] hover:bg-white/[0.06] transition-colors duration-100 border-b border-white/[0.06]"
            >
              <span>←</span>
              <span>{t('modList.allProjects')}</span>
            </button>

            {/* Project list */}
            <div className="max-h-[200px] overflow-y-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSwitchProject(project.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 transition-colors duration-100 ${
                    project.id === currentProject.id
                      ? 'bg-white/[0.06] text-[#D4A017]'
                      : 'text-[#FAFAFA] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[10px] font-medium truncate">{project.name}</div>
                    <div className="text-[8px] text-[#86868b]">{project.mc_version} · {project.loader}</div>
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
              className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] text-[#86868b] hover:text-[#A1A1AA] hover:bg-white/[0.06] transition-colors duration-100 border-t border-white/[0.06]"
            >
              <span className="text-[#D4A017]">+</span>
              <span>{t('modList.newProject')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Search filter */}
      <div className="px-3 pt-2 pb-1">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-[#86868b]">⌕</span>
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder={t('modList.searchMods')}
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-md pl-6 pr-2 py-1.5 text-[10px] text-[#FAFAFA] placeholder-[#52525B] focus:outline-none focus:border-[#D4A017]/40 focus:bg-white/[0.06] transition-colors duration-150"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-[#52525B] hover:text-[#A1A1AA] transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Mod list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 pt-1 pb-1">
          <div className="text-[8px] text-[#86868b] uppercase tracking-wider">
            {t('modList.mods', { count: filteredMods.length })}
          </div>
        </div>
        <div className="px-1.5">
          {filteredMods.map((mod) => {
            const nodeType = getNodeType(mod);
            const color = NODE_COLORS[nodeType];
            const isSelected = selectedModIds.has(mod.id);
            return (
              <div
                key={mod.id}
                onClick={(e) => handleModClick(mod.id, e)}
                className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#D4A017]/10 ring-1 ring-[#D4A017]/30'
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                {/* Icon 24x24 */}
                {mod.icon_url ? (
                  <img src={mod.icon_url} alt="" className="w-6 h-6 rounded bg-[#27272A] shrink-0" />
                ) : (
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-medium shrink-0"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {mod.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#FAFAFA] truncate">{mod.name}</div>
                  <div className="flex items-center gap-1">
                    <span className="text-[7px] text-[#86868b] font-mono">{mod.version_number ?? '—'}</span>
                  </div>
                </div>
                {/* Type tag */}
                <span
                  className="text-[7px] px-1 py-0.5 rounded font-medium shrink-0"
                  style={{ backgroundColor: `${color}15`, color }}
                >
                  {NODE_LABELS[nodeType]}
                </span>
                <button
                  onClick={(e) => handleRemoveMod(mod.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-[#52525B] hover:text-[#EF4444] transition-all duration-100 text-[10px] shrink-0"
                  title={t('modList.removeMod')}
                >
                  ✕
                </button>
              </div>
            );
          })}
          {filteredMods.length === 0 && filterQuery && (
            <div className="px-2 py-4 text-center text-[9px] text-[#52525B]">
              {t('search.noResults')}
            </div>
          )}
        </div>
      </div>

      {/* Batch action bar */}
      {selectedModIds.size > 1 && (
        <div className="px-3 py-2 border-t border-white/[0.06] bg-[#D4A017]/5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#D4A017]">
              {t('modList.selected', { count: selectedModIds.size })}
            </span>
            <button
              onClick={handleBatchDelete}
              className="text-[9px] px-2.5 py-1 rounded-md bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors duration-150"
            >
              {t('modList.batchDelete')}
            </button>
          </div>
        </div>
      )}

      {/* Add mod button */}
      <div className="p-2 border-t border-white/[0.06]">
        <button
          onClick={() => togglePanel('search')}
          className="w-full flex items-center gap-2 px-2.5 py-2 bg-white/[0.04] rounded-lg text-[10px] text-[#86868b] hover:text-[#D4A017] hover:bg-white/[0.08] transition-colors duration-150"
        >
          <span className="text-[#D4A017]">+</span>
          <span>{t('modList.addMod')}</span>
          <kbd className="ml-auto text-[7px] font-mono text-[#3F3F46] bg-[#09090B] px-1 py-0.5 rounded">⌘K</kbd>
        </button>
      </div>
    </div>
  );
}
