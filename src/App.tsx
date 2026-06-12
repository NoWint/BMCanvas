import { Sidebar } from './components/layout/Sidebar';
import { Canvas } from './components/layout/Canvas';
import { Inspector } from './components/layout/Inspector';
import { useProjectStore } from './stores/projectStore';
import { useDiagnostics } from './hooks/useDiagnostics';
import * as tauri from './lib/tauri';
import { useState, useEffect } from 'react';
import type { Dependency } from './types';

export default function App() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const mods = useProjectStore((s) => s.mods);
  const [deps, setDeps] = useState<Dependency[]>([]);

  useEffect(() => {
    if (!currentProject) return;
    tauri.getAllDependencies(currentProject.id).then(setDeps).catch(console.error);
  }, [currentProject, mods]);

  const diagnostics = useDiagnostics(deps);
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;
  const criticalCount = diagnostics.filter((d) => d.severity === 'critical').length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-base">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas />
        <Inspector />
      </div>
      <footer className="h-6 bg-surface border-t border-sep flex items-center px-4 text-[10px] font-mono text-muted gap-4">
        {currentProject ? (
          <>
            <span>{mods.length} mods</span>
            <span>{deps.length} deps</span>
            {warningCount > 0 && <span className="text-warning">{warningCount} warn</span>}
            {criticalCount > 0 && <span className="text-danger">{criticalCount} crit</span>}
            {diagnostics.length === 0 && <span className="text-success">ok</span>}
          </>
        ) : (
          <span>No project</span>
        )}
      </footer>
    </div>
  );
}
