import { useQuery } from '@tanstack/react-query';
import * as tauri from '../lib/tauri';

export function useModSearch(query: string, loaders?: string[], gameVersions?: string[]) {
  return useQuery({
    queryKey: ['modSearch', query, loaders, gameVersions],
    queryFn: () =>
      tauri.searchMods(query, {
        loaders: loaders,
        game_versions: gameVersions,
      }, 20, 0),
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useModVersions(modrinthId: string | null, mcVersion?: string, loader?: string) {
  return useQuery({
    queryKey: ['modVersions', modrinthId, mcVersion, loader],
    queryFn: () => tauri.getModVersions(modrinthId!, mcVersion, loader),
    enabled: modrinthId !== null,
    staleTime: 10 * 60 * 1000,
  });
}
