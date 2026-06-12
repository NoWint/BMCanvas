import type { ProjectMod, Diagnostic, Dependency } from '../types';

const KNOWN_INCOMPATIBILITIES: { mod1: string; mod2: string; reason: string }[] = [
  { mod1: 'optifine', mod2: 'sodium', reason: 'Rendering pipeline incompatibility' },
  { mod1: 'optifine', mod2: 'lithium', reason: 'Potential game logic conflicts' },
  { mod1: 'rubidium', mod2: 'embeddium', reason: 'Both are Sodium ports, redundant' },
  { mod1: 'optifine', mod2: 'iris', reason: 'Iris requires Sodium, incompatible with Optifine' },
  { mod1: 'sodium', mod2: 'rubidium', reason: 'Both provide the same rendering optimization' },
  { mod1: 'sodium', mod2: 'embeddium', reason: 'Both provide the same rendering optimization' },
];

const CATEGORY_GROUPS: Record<string, string[]> = {
  'rendering': ['sodium', 'rubidium', 'embeddium', 'optifine', 'iris', 'oculus', 'starlight', 'phosphor'],
  'optimization': ['lithium', 'ferritecore', 'modernfix', 'entityculling', 'farsight'],
  'shaders': ['iris', 'oculus', 'optifine'],
  'storage': ['applied-energistics-2', 'refined-storage', 'mekanism', 'thermal-expansion'],
  'automation': ['create', 'mekanism', 'thermal-expansion', 'immersive-engineering'],
};

export function detectConflicts(
  mods: ProjectMod[],
  dependencies: Dependency[],
  mcVersion: string,
  loader: string
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const slugSet = new Set(mods.map((m) => (m.slug ?? '').toLowerCase()));
  const slugToMod = new Map(mods.map((m) => [(m.slug ?? '').toLowerCase(), m]));

  // 1. Missing required dependencies
  for (const dep of dependencies) {
    if (dep.dep_type === 'required') {
      const depSlug = dep.depends_on_slug.toLowerCase();
      if (!slugSet.has(depSlug)) {
        const fromMod = mods.find((m) => m.id === dep.project_mod_id);
        diagnostics.push({
          id: `missing-${dep.id}`,
          severity: 'critical',
          type: 'missing_dependency',
          title: 'Missing Dependency',
          description: `${fromMod?.name ?? 'Unknown'} requires ${dep.depends_on_slug}, which is not in the project`,
          affectedMods: [dep.project_mod_id],
          suggestedFix: `Add ${dep.depends_on_slug} to your project`,
        });
      }
    }
  }

  // 2. Version mismatch
  for (const mod of mods) {
    const supportedVersions = mod.supported_mc_versions ?? [];
    if (supportedVersions.length > 0 && !supportedVersions.includes(mcVersion)) {
      diagnostics.push({
        id: `version-${mod.id}`,
        severity: 'warning',
        type: 'version_mismatch',
        title: 'Version Mismatch',
        description: `${mod.name} does not support Minecraft ${mcVersion}. Supported: ${supportedVersions.join(', ')}`,
        affectedMods: [mod.id],
        suggestedFix: `Remove ${mod.name} or switch to a supported Minecraft version`,
      });
    }
  }

  // 3. Known incompatibilities
  for (const { mod1, mod2, reason } of KNOWN_INCOMPATIBILITIES) {
    const mod1Instance = mods.find((m) => (m.slug ?? '').toLowerCase() === mod1);
    const mod2Instance = mods.find((m) => (m.slug ?? '').toLowerCase() === mod2);
    if (mod1Instance && mod2Instance) {
      diagnostics.push({
        id: `incompat-${mod1}-${mod2}`,
        severity: 'critical',
        type: 'known_incompatibility',
        title: 'Known Incompatibility',
        description: `${mod1Instance.name} and ${mod2Instance.name} are incompatible: ${reason}`,
        affectedMods: [mod1Instance.id, mod2Instance.id],
        suggestedFix: `Remove one of the conflicting mods`,
      });
    }
  }

  // 4. Duplicate functionality
  for (const [category, slugs] of Object.entries(CATEGORY_GROUPS)) {
    const present = slugs
      .map((slug) => mods.find((m) => (m.slug ?? '').toLowerCase() === slug))
      .filter(Boolean) as ProjectMod[];

    if (present.length > 1) {
      diagnostics.push({
        id: `duplicate-${category}`,
        severity: 'warning',
        type: 'duplicate_functionality',
        title: 'Duplicate Functionality',
        description: `Multiple mods provide ${category} functionality: ${present.map((m) => m.name).join(', ')}`,
        affectedMods: present.map((m) => m.id),
        suggestedFix: `Consider keeping only one: ${present.map((m) => m.name).join(' or ')}`,
      });
    }
  }

  // 5. Loader conflicts
  for (const mod of mods) {
    const modSlug = (mod.slug ?? '').toLowerCase();
    const isForgeMod = modSlug.includes('forge') && !modSlug.includes('neoforge');
    const isFabricMod = modSlug.includes('fabric');
    const isQuiltMod = modSlug.includes('quilt');

    if (loader === 'fabric' && isForgeMod) {
      diagnostics.push({
        id: `loader-${mod.id}`,
        severity: 'critical',
        type: 'loader_mismatch',
        title: 'Loader Conflict',
        description: `${mod.name} is a Forge mod but the project uses Fabric`,
        affectedMods: [mod.id],
        suggestedFix: `Remove ${mod.name} or switch to a Fabric-compatible alternative`,
      });
    }
    if ((loader === 'forge' || loader === 'neoforge') && isFabricMod && !isForgeMod) {
      diagnostics.push({
        id: `loader-${mod.id}`,
        severity: 'critical',
        type: 'loader_mismatch',
        title: 'Loader Conflict',
        description: `${mod.name} is a Fabric mod but the project uses ${loader}`,
        affectedMods: [mod.id],
        suggestedFix: `Remove ${mod.name} or switch to a Forge-compatible alternative`,
      });
    }
  }

  return diagnostics;
}
