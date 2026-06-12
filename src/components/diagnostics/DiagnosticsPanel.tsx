import { useDiagnostics } from '../../hooks/useDiagnostics';
import { useProjectStore } from '../../stores/projectStore';
import * as tauri from '../../lib/tauri';
import { useState, useEffect } from 'react';
import type { Dependency } from '../../types';

const SEVERITY_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  critical: { bg: 'bg-danger/10', text: 'text-danger', icon: '●' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', icon: '▲' },
  info: { bg: 'bg-info/10', text: 'text-info', icon: 'ℹ' },
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
      <div className="p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4 font-heading">Diagnostics</h2>
        <p className="text-text-secondary">Select a project to run diagnostics</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-text-primary font-heading">Diagnostics</h2>
        <span className="text-xs text-text-tertiary">
          {diagnostics.length} issue{diagnostics.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {diagnostics.length === 0 ? (
        <div className="bg-surface rounded-xl p-6 text-center">
          <p className="text-success font-medium">All checks passed</p>
          <p className="text-text-tertiary text-sm mt-1">No conflicts or issues detected</p>
        </div>
      ) : (
        <div className="space-y-2">
          {diagnostics.map((diag) => {
            const style = SEVERITY_STYLES[diag.severity] ?? SEVERITY_STYLES.info;
            return (
              <div
                key={diag.id}
                className={`bg-surface rounded-xl p-4 border border-separator/50 ${style.bg}`}
              >
                <div className="flex items-start gap-2">
                  <span className={`${style.text} text-sm mt-0.5`}>{style.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-text-primary">{diag.title}</h3>
                    <p className="text-xs text-text-secondary mt-1">{diag.description}</p>
                    <p className="text-xs text-accent mt-1">Fix: {diag.suggestedFix}</p>
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
