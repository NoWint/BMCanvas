// Project types
export type Loader = 'forge' | 'neoforge' | 'fabric' | 'quilt';

export interface Project {
  id: string;
  name: string;
  description: string;
  mc_version: string;
  loader: Loader;
  author: string;
  tags: string[];
  created_at: number;
  updated_at: number;
}

export interface ProjectInput {
  name: string;
  description: string;
  mc_version: string;
  loader: Loader;
  author: string;
  tags: string[];
}

// Mod types
export interface ProjectMod {
  id: string;
  project_id: string;
  modrinth_id: string | null;
  slug: string | null;
  name: string;
  version_id: string | null;
  version_number: string | null;
  icon_url: string | null;
  description: string | null;
  author: string | null;
  source_url: string | null;
  license: string | null;
  added_at: number;
}

export interface ModInput {
  modrinth_id: string | null;
  slug: string | null;
  name: string;
  version_id: string | null;
  version_number: string | null;
  icon_url: string | null;
  description: string | null;
  author: string | null;
  source_url: string | null;
  license: string | null;
}

// Dependency types
export type DepType = 'required' | 'optional' | 'incompatible';

export interface Dependency {
  id: string;
  project_mod_id: string;
  depends_on_slug: string;
  dep_type: DepType;
  dep_modrinth_id: string | null;
}

export interface DepInput {
  depends_on_slug: string;
  dep_type: DepType;
  dep_modrinth_id: string | null;
}

// Modrinth API types
export interface ModrinthSearchResult {
  hits: ModrinthSearchHit[];
  offset: number;
  limit: number;
  total_hits: number;
}

export interface ModrinthSearchHit {
  project_id: string;
  project_type: string;
  slug: string;
  author: string;
  title: string;
  description: string;
  categories: string[];
  display_categories: string[];
  downloads: number;
  icon_url: string;
  latest_version: string;
  client_side: string;
  server_side: string;
  versions: string[];
  loaders: string[];
}

export interface ModrinthVersion {
  id: string;
  project_id: string;
  name: string;
  version_number: string;
  changelog: string;
  dependencies: ModrinthDependency[];
  game_versions: string[];
  loaders: string[];
  files: ModrinthFile[];
}

export interface ModrinthDependency {
  version_id: string | null;
  project_id: string | null;
  file_name: string | null;
  dependency_type: 'required' | 'optional' | 'incompatible';
}

export interface ModrinthFile {
  hashes: Record<string, string>;
  url: string;
  filename: string;
  primary: boolean;
  size: number;
  file_type: string | null;
}

// Diagnostic types
export type DiagnosticSeverity = 'info' | 'warning' | 'critical';
export type DiagnosticType = 'version_mismatch' | 'loader_mismatch' | 'missing_dependency' | 'known_incompatibility';

export interface Diagnostic {
  id: string;
  severity: DiagnosticSeverity;
  type: DiagnosticType;
  title: string;
  description: string;
  affectedMods: string[];
  suggestedFix: string;
}

// Export types
export type ExportFormat = 'modrinth' | 'curseforge' | 'prism' | 'zip';

export interface ExportResult {
  success: boolean;
  path: string;
  format: ExportFormat;
}

// UI types
export type ViewType = 'projects' | 'discover' | 'graph' | 'diagnostics' | 'export';

// Graph types
export type NodeType = 'mod' | 'library' | 'api' | 'loader';

export interface ModNodeData {
  modId: string;
  name: string;
  version: string | null;
  loader: string | null;
  iconUrl: string | null;
  nodeType: NodeType;
  dependencyCount: number;
  collapsed: boolean;
  hasConflict: boolean;
}
