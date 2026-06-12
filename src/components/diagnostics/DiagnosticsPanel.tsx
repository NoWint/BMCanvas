import { Warning, Info, WarningOctagon, CheckCircle } from '@phosphor-icons/react';
import { useDiagnostics } from '../../hooks/useDiagnostics';
import { useProjectStore } from '../../stores/projectStore';
import * as tauri from '../../lib/tauri';
import { useState, useEffect } from 'react';
import type { Dependency, DiagnosticSeverity } from '../../types';

const SEVERITY_CONFIG: Record<string, { icon: typeof Warning; color: string; bg: string; border: string }> = {
  critical: { icon: WarningOctagon, color: 'text-danger', bg: 'bg-danger/5', border: 'border-danger/20' },
  warning: { icon: Warning, color: 'text-warning', bg: 'bg-warning/5', border: 'border-warning/20' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/5', border: 'border-info/20' },
};

export function DiagnosticsPanel() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const mods = useProjectStore((s) => s.mods);
  const [deps, setDeps] = useState<Dependency[]>([]);

  useEffect(() => {
    if (!currentProject) return;
    tauri.getAllDependencies(currentProject.id).then(setDeps).catch(console.error);
  }, [currentProject, mods]);

  const diagnostics = useDiagnostics(deps);

  if (!currentProject) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">Diagnostics</h2>
        <p className="text-text-tertiary text-sm">Select a project to run diagnostics</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-heading font-semibold text-text-primary">Diagnostics</h2>
        <span className="text-[11px] font-mono text-text-tertiary">
          {diagnostics.length} issue{diagnostics.length !== 1 ? 's' : ''}
        </span>
      </div>

      {diagnostics.length === 0 ? (
        <div className="bg-surface rounded-xl p-8 text-center border border-separator">
          <CheckCircle size={32} className="text-success mx-auto mb-3" weight="fill" />
          <p className="text-success font-medium text-sm">All checks passed</p>
          <p className="text-text-tertiary text-xs mt-1">No conflicts or issues detected</p>
        </div>
      ) : (
        <div className="space-y-2">
          {diagnostics.map((diag) => {
            const config = SEVERITY_CONFIG[diag.severity] ?? SEVERITY_CONFIG.info;
            const Icon = config.icon;
            return (
              <div
                key={diag.id}
                className={`bg-surface rounded-lg p-4 border ${config.border} ${config.bg}`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={18} className={`${config.color} mt-0.5 flex-shrink-0`} weight="fill" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-text-primary">{diag.title}</h3>
                    <p className="text-xs text-text-secondary mt-1">{diag.description}</p>
                    <p className="text-xs text-accent mt-1.5 font-mono">Fix: {diag.suggestedFix}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
