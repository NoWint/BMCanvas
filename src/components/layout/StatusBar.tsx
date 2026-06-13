import { useProjectStore } from '../../stores/projectStore';
import { useGraphStore } from '../../stores/graphStore';
import { detectConflicts } from '../../engine/conflictDetector';
import * as tauri from '../../lib/tauri';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type OperationStatus = 'loading' | 'fetchingDeps' | 'exporting' | 'ready';

export function StatusBar() {
  const { t, i18n } = useTranslation();
  const { currentProject, mods, loading } = useProjectStore();
  const [depCount, setDepCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [operationStatus, setOperationStatus] = useState<OperationStatus>('ready');

  useEffect(() => {
    if (!currentProject) return;
    const update = async () => {
      setOperationStatus('loading');
      try {
        const deps = await tauri.getAllDependencies(currentProject.id);
        setDepCount(deps.length);
        const diags = detectConflicts(mods, deps, currentProject.mc_version, currentProject.loader);
        setCriticalCount(diags.filter((d) => d.severity === 'critical').length);
        setWarningCount(diags.filter((d) => d.severity === 'warning').length);
      } finally {
        setOperationStatus('ready');
      }
    };
    update();
  }, [currentProject, mods]);

  // Show loading status when project is loading
  useEffect(() => {
    if (loading) {
      setOperationStatus('loading');
    } else if (operationStatus === 'loading') {
      setOperationStatus('ready');
    }
  }, [loading]);

  if (!currentProject) {
    return (
      <div className="h-[24px] bg-[#09090B]/80 backdrop-blur-xl border-t border-white/[0.06] flex items-center px-3 text-[9px] font-mono text-[#52525B]">
        <span className="text-[#D4A017]">●</span>
        <span className="ml-2">ModCanvas</span>
      </div>
    );
  }

  const statusLabel = (() => {
    switch (operationStatus) {
      case 'loading': return t('statusBar.loading');
      case 'fetchingDeps': return t('statusBar.fetchingDeps');
      case 'exporting': return t('statusBar.exporting');
      case 'ready': return t('statusBar.ready');
    }
  })();

  const statusColor = operationStatus === 'ready' ? '#22C55E' : '#D4A017';

  return (
    <div className="h-[24px] bg-[#09090B]/80 backdrop-blur-xl border-t border-white/[0.06] flex items-center px-3 text-[9px] font-mono">
      {/* Left section: project info + diagnostics */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[#D4A017] shrink-0">●</span>
        <span className="text-[#FAFAFA] truncate">{currentProject.name}</span>
        <span className="text-[#86868b] shrink-0">{currentProject.mc_version}</span>
        <span className="text-[#86868b] shrink-0">{currentProject.loader}</span>
        <span className="text-[#52525B] shrink-0">{t('statusBar.mods', { count: mods.length })}</span>
        <span className="text-[#3F3F46] shrink-0">{t('statusBar.deps', { count: depCount })}</span>
        {criticalCount > 0 && <span className="text-[#EF4444] shrink-0">{t('statusBar.crit', { count: criticalCount })}</span>}
        {warningCount > 0 && <span className="text-[#F59E0B] shrink-0">{t('statusBar.warn', { count: warningCount })}</span>}
      </div>

      {/* Center section: operation status */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-1.5">
          {operationStatus !== 'ready' && (
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
          )}
          <span className="text-[#86868b]">{statusLabel}</span>
        </div>
      </div>

      {/* Right section: language switch + reset layout */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            const newLang = i18n.language === 'zh-CN' ? 'en' : 'zh-CN';
            i18n.changeLanguage(newLang);
          }}
          className="text-[9px] text-[#86868b] hover:text-[#FAFAFA] font-mono transition-colors px-1.5 py-0.5 rounded hover:bg-white/[0.04]"
        >
          {i18n.language === 'zh-CN' ? '中' : 'EN'}
        </button>
        <span className="text-[#27272A]">|</span>
        <button
          onClick={() => useGraphStore.getState().resetLayout()}
          className="text-[9px] text-[#86868b] hover:text-[#FAFAFA] font-mono transition-colors px-1.5 py-0.5 rounded hover:bg-white/[0.04]"
          title={t('graph.resetLayout')}
        >
          ↺
        </button>
      </div>
    </div>
  );
}
