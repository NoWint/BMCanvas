import type { ProjectMod, Diagnostic, Dependency } from '../types';

const KNOWN_INCOMPATIBILITIES: { mod1: string; mod2: string; reason: string }[] = [
  { mod1: 'optifine', mod2: 'sodium', reason: 'Rendering pipeline incompatibility' },
  { mod1: 'optifine', mod2: 'lithium', reason: 'Potential game logic conflicts' },
  { mod1: 'rubidium', mod2: 'embeddium', reason: 'Both are Sodium ports, redundant' },
];

export function detectConflicts(
  mods: ProjectMod[],
  dependencies: Dependency[],
  mcVersion: string,
  loader: string
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const slugSet = new Set(mods.map((m) => (m.slug ?? '').toLowerCase()));

  // Missing required dependencies
  for (const dep of dependencies) {
    if (dep.dep_type === 'required') {
      const depSlug = dep.depends_on_slug.toLowerCase();
      if (!slugSet.has(depSlug)) {
        const fromMod = mods.find((m) => m.id === dep.project_mod_id);
        diagnostics.push({
          id: `missing-${dep.id}`,
          severity: 'warning',
          type: 'missing_dependency',
          title: 'Missing Dependency',
          description: `${fromMod?.name ?? 'Unknown'} requires ${dep.depends_on_slug}, which is not in the project`,
          affectedMods: [dep.project_mod_id],
          suggestedFix: `Add ${dep.depends_on_slug} to your project`,
        });
      }
    }
  }

  // Known incompatibilities
  for (const { mod1, mod2, reason } of KNOWN_INCOMPATIBILITIES) {
    const mod1Instance = mods.find((m) => (m.slug ?? '').toLowerCase() === mod1);
    const mod2Instance = mods.find((m) => (m.slug ?? '').toLowerCase() === mod2);
    if (mod1Instance && mod2Instance) {
      diagnostics.push({
        id: `incompat-${mod1}-${mod2}`,
        severity: 'warning',
        type: 'known_incompatibility',
        title: 'Known Incompatibility',
        description: `${mod1Instance.name} and ${mod2Instance.name} are incompatible: ${reason}`,
        affectedMods: [mod1Instance.id, mod2Instance.id],
        suggestedFix: `Remove one of the conflicting mods`,
      });
    }
  }

  return diagnostics;
}
