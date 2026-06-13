import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { detectConflicts } from '../../engine/conflictDetector';
import * as tauri from '../../lib/tauri';
import type { Diagnostic, DiagnosticSeverity } from '../../types';

const SEVERITY_STYLES: Record<DiagnosticSeverity, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: '#ff453a', bg: 'rgba(255,69,58,0.06)', border: '#ff453a', label: 'CRITICAL' },
  warning: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.06)', border: '#ff9f0a', label: 'WARNING' },
  info: { color: '#0a84ff', bg: 'rgba(10,132,255,0.06)', border: '#0a84ff', label: 'INFO' },
};

export function DiagnosticsPanel() {
  const { t } = useTranslation();
  const { mods, currentProject } = useProjectStore();
  const { closePanel, setSelectedNode, openInspector } = useUIStore();
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);

  useEffect(() => {
    if (!currentProject) return;
    const load = async () => {
      const deps = await tauri.getAllDependencies(currentProject.id);
      const diags = detectConflicts(mods, deps, currentProject.mc_version, currentProject.loader);
      setDiagnostics(diags);
    };
    load();
  }, [mods, currentProject]);

  const handleClick = (modId: string) => {
    setSelectedNode(modId);
    openInspector(modId);
    closePanel();
  };

  const critical = diagnostics.filter((d) => d.severity === 'critical');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');
  const infos = diagnostics.filter((d) => d.severity === 'info');

  const renderGroup = (label: string, items: Diagnostic[]) => {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="text-[9px] text-[#48484a] uppercase tracking-wider px-3 py-1.5">{label} ({items.length})</div>
        {items.map((d) => {
          const style = SEVERITY_STYLES[d.severity];
          return (
            <div
              key={d.id}
              className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-300"
              style={{ borderLeft: `3px solid ${style.border}`, background: style.bg }}
              onClick={() => d.affectedMods[0] && handleClick(d.affectedMods[0])}
            >
              <span className="text-[9px] font-semibold mt-0.5 shrink-0" style={{ color: style.color }}>
                {style.label}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#f5f5f7]">{d.title}</div>
                <div className="text-[9px] text-[#86868b] mt-0.5">{d.description}</div>
                <div className="text-[9px] text-[#48484a] mt-0.5">Fix: {d.suggestedFix}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 animate-slide-up">
      <div className="absolute inset-0 bg-[#000000]/40" onClick={closePanel} />
      <div className="relative glass-panel rounded-t-xl max-h-[40vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgba(255,255,255,0.08)]">
          <span className="text-[13px] text-[#f5f5f7] font-medium">{t('diagnostics.title')}</span>
          <div className="flex items-center gap-2">
            {critical.length > 0 && (
              <span className="text-[9px] text-[#ff453a] bg-[rgba(255,69,58,0.1)] px-1.5 py-0.5 rounded">
                {critical.length} {t('diagnostics.critical')}
              </span>
            )}
            {warnings.length > 0 && (
              <span className="text-[9px] text-[#ff9f0a] bg-[rgba(255,159,10,0.1)] px-1.5 py-0.5 rounded">
                {warnings.length} {t('diagnostics.warning')}
              </span>
            )}
            <button onClick={closePanel} className="text-[#48484a] hover:text-[#f5f5f7] text-[11px] transition-colors duration-300">✕</button>
          </div>
        </div>
        {diagnostics.length === 0 ? (
          <div className="px-4 py-6 text-center text-[#48484a] text-[13px]">{t('diagnostics.noIssues')}</div>
        ) : (
          <>
            {renderGroup(t('diagnostics.critical'), critical)}
            {renderGroup(t('diagnostics.warning'), warnings)}
            {renderGroup(t('diagnostics.info'), infos)}
          </>
        )}
      </div>
    </div>
  );
}
