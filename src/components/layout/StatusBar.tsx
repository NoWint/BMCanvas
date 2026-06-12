import { useProjectStore } from '../../stores/projectStore';
import { detectConflicts } from '../../engine/conflictDetector';
import * as tauri from '../../lib/tauri';
import { useEffect, useState } from 'react';

export function StatusBar() {
  const { currentProject, mods } = useProjectStore();
  const [depCount, setDepCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);

  useEffect(() => {
    if (!currentProject) return;
    const update = async () => {
      const deps = await tauri.getAllDependencies(currentProject.id);
      setDepCount(deps.length);
      const diags = detectConflicts(mods, deps, currentProject.mc_version, currentProject.loader);
      setCriticalCount(diags.filter((d) => d.severity === 'critical').length);
      setWarningCount(diags.filter((d) => d.severity === 'warning').length);
    };
    update();
  }, [currentProject, mods]);

  if (!currentProject) {
    return (
      <div className="h-[22px] bg-[#09090B] border-t border-[#1E1E22] flex items-center px-3 text-[9px] font-mono text-[#3F3F46]">
        ModCanvas
      </div>
    );
  }

  return (
    <div className="h-[22px] bg-[#09090B] border-t border-[#1E1E22] flex items-center px-3 gap-4 text-[9px] font-mono">
      <span className="text-[#D4A017]">●</span>
      <span className="text-[#A1A1AA]">{currentProject.name}</span>
      <span className="text-[#52525B]">{currentProject.mc_version}</span>
      <span className="text-[#52525B]">{currentProject.loader}</span>
      <span className="ml-auto text-[#52525B]">{mods.length} mods</span>
      <span className="text-[#3F3F46]">{depCount} deps</span>
      {criticalCount > 0 && <span className="text-[#EF4444]">{criticalCount} crit</span>}
      {warningCount > 0 && <span className="text-[#F59E0B]">{warningCount} warn</span>}
    </div>
  );
}
