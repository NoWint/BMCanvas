import type { ProjectMod, Dependency, DepType } from '../types';

export interface ResolvedDependency {
  fromModId: string;
  toSlug: string;
  depType: DepType;
  toModrinthId: string | null;
  resolved: boolean;
  resolvedModId: string | null;
}

export function resolveDependencies(
  mods: ProjectMod[],
  storedDeps: Dependency[]
): ResolvedDependency[] {
  const slugToMod = new Map<string, ProjectMod>();
  const modrinthIdToMod = new Map<string, ProjectMod>();

  for (const mod of mods) {
    if (mod.slug) slugToMod.set(mod.slug.toLowerCase(), mod);
    if (mod.modrinth_id) modrinthIdToMod.set(mod.modrinth_id, mod);
  }

  return storedDeps.map((dep) => {
    const slugMatch = slugToMod.get(dep.depends_on_slug.toLowerCase());
    const modrinthMatch = dep.dep_modrinth_id
      ? modrinthIdToMod.get(dep.dep_modrinth_id)
      : null;
    const resolved = slugMatch ?? modrinthMatch;

    return {
      fromModId: dep.project_mod_id,
      toSlug: dep.depends_on_slug,
      depType: dep.dep_type as DepType,
      toModrinthId: dep.dep_modrinth_id,
      resolved: resolved !== undefined,
      resolvedModId: resolved?.id ?? null,
    };
  });
}

export function getNodeType(mod: ProjectMod): 'mod' | 'library' | 'api' | 'loader' {
  const slug = (mod.slug ?? '').toLowerCase();
  const name = mod.name.toLowerCase();

  if (slug.includes('forge') || slug.includes('fabric') || slug.includes('quilt') || slug.includes('neoforge')) {
    return 'loader';
  }
  if (slug.includes('api') || name.includes(' api')) {
    return 'api';
  }
  if (slug.includes('lib') || name.includes(' library') || name.includes('lib')) {
    return 'library';
  }
  return 'mod';
}
