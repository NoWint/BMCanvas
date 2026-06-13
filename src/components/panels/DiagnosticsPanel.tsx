import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { detectConflicts } from '../../engine/conflictDetector';
import * as tauri from '../../lib/tauri';
import type { Diagnostic, DiagnosticSeverity } from '../../types';

const SEVERITY_STYLES: Record<DiagnosticSeverity, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: '#EF4444', bg: '#EF444408', border: '#EF4444', label: 'CRITICAL' },
  warning: { color: '#F59E0B', bg: '#F59E0B08', border: '#F59E0B', label: 'WARNING' },
  info: { color: '#3B82F6', bg: '#3B82F608', border: '#3B82F6', label: 'INFO' },
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
        <div className="text-[8px] text-[#52525B] uppercase tracking-wider px-3 py-1.5">{label} ({items.length})</div>
        {items.map((d) => {
          const style = SEVERITY_STYLES[d.severity];
          return (
            <div
              key={d.id}
              className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-[#1E1E22] transition-colors duration-100"
              style={{ borderLeft: `3px solid ${style.border}`, background: style.bg }}
              onClick={() => d.affectedMods[0] && handleClick(d.affectedMods[0])}
            >
              <span className="text-[8px] font-semibold mt-0.5 shrink-0" style={{ color: style.color }}>
                {style.label}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-[#FAFAFA]">{d.title}</div>
                <div className="text-[8px] text-[#71717A] mt-0.5">{d.description}</div>
                <div className="text-[8px] text-[#52525B] mt-0.5">Fix: {d.suggestedFix}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 animate-slide-up">
      <div className="absolute inset-0 bg-[#09090B]/40" onClick={closePanel} />
      <div className="relative bg-[#111113] border-t border-[#27272A] max-h-[40vh] overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#1E1E22]">
          <span className="text-[10px] text-[#FAFAFA] font-medium">{t('diagnostics.title')}</span>
          <div className="flex items-center gap-2">
            {critical.length > 0 && (
              <span className="text-[8px] text-[#EF4444] bg-[#EF444411] px-1.5 py-0.5 rounded">
                {critical.length} {t('diagnostics.critical')}
              </span>
            )}
            {warnings.length > 0 && (
              <span className="text-[8px] text-[#F59E0B] bg-[#F59E0B11] px-1.5 py-0.5 rounded">
                {warnings.length} {t('diagnostics.warning')}
              </span>
            )}
            <button onClick={closePanel} className="text-[#3F3F46] hover:text-[#FAFAFA] text-[10px]">✕</button>
          </div>
        </div>
        {diagnostics.length === 0 ? (
          <div className="px-3 py-6 text-center text-[#52525B] text-[10px]">{t('diagnostics.noIssues')}</div>
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
