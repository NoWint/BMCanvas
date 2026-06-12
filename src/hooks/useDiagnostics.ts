import { useMemo } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { detectConflicts } from '../engine/conflictDetector';
import type { Diagnostic, Dependency } from '../types';

export function useDiagnostics(deps: Dependency[]): Diagnostic[] {
  const mods = useProjectStore((s) => s.mods);
  const currentProject = useProjectStore((s) => s.currentProject);

  return useMemo(() => {
    if (!currentProject) return [];
    return detectConflicts(mods, deps, currentProject.mc_version, currentProject.loader);
  }, [mods, deps, currentProject]);
}
