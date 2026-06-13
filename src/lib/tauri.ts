// Detect if running inside Tauri webview
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// Lazy-loaded real invoke (only available in Tauri webview)
let realInvoke: typeof import('@tauri-apps/api/core').invoke | null = null;

async function getInvoke() {
  if (realInvoke) return realInvoke;
  if (isTauri) {
    const mod = await import('@tauri-apps/api/core');
    realInvoke = mod.invoke;
    return realInvoke;
  }
  return null;
}

// In-memory mock store for browser/dev mode
const mockProjects: Map<string, any> = new Map();
const mockMods: Map<string, any[]> = new Map();
const mockDeps: Map<string, any[]> = new Map();
let mockIdCounter = 1;

// ── Mock Mod Database (20+ entries) ──────────────────────────────────
const MOCK_MODS_DB: any[] = [
  // Optimization
  {
    project_id: 'mock-sodium', project_type: 'mod', slug: 'sodium', title: 'Sodium',
    description: 'Modern rendering engine for Minecraft that greatly improves frame rates.',
    author: 'jellysquid3', categories: ['optimization', 'fabric'], display_categories: ['optimization'],
    downloads: 15000000, icon_url: '', latest_version: '0.6.0', client_side: 'required', server_side: 'unsupported',
    versions: ['1.21.1', '1.20.4', '1.20.1'], loaders: ['fabric', 'neoforge'],
  },
  {
    project_id: 'mock-iris', project_type: 'mod', slug: 'iris', title: 'Iris Shaders',
    description: 'A shader loader for Minecraft with Sodium support.',
    author: 'coderbot', categories: ['optimization', 'fabric'], display_categories: ['optimization'],
    downloads: 8000000, icon_url: '', latest_version: '1.8.0', client_side: 'required', server_side: 'unsupported',
    versions: ['1.21.1', '1.20.4'], loaders: ['fabric'],
  },
  {
    project_id: 'mock-lithium', project_type: 'mod', slug: 'lithium', title: 'Lithium',
    description: 'General-purpose optimization mod for Minecraft that improves game logic.',
    author: 'jellysquid3', categories: ['optimization', 'fabric'], display_categories: ['optimization'],
    downloads: 6000000, icon_url: '', latest_version: '0.13.0', client_side: 'optional', server_side: 'optional',
    versions: ['1.21.1', '1.20.4', '1.20.1'], loaders: ['fabric'],
  },
  {
    project_id: 'mock-ferritecore', project_type: 'mod', slug: 'ferritecore', title: 'FerriteCore',
    description: 'Memory optimization mod that reduces Minecraft memory usage significantly.',
    author: 'malte0811', categories: ['optimization', 'fabric'], display_categories: ['optimization'],
    downloads: 4500000, icon_url: '', latest_version: '7.0.0', client_side: 'optional', server_side: 'optional',
    versions: ['1.21.1', '1.20.4'], loaders: ['fabric', 'neoforge'],
  },
  {
    project_id: 'mock-fabric-api', project_type: 'mod', slug: 'fabric-api', title: 'Fabric API',
    description: 'Core API layer for Fabric mods, providing hooks and utilities.',
    author: 'modmuss50', categories: ['optimization', 'fabric', 'library'], display_categories: ['optimization'],
    downloads: 20000000, icon_url: '', latest_version: '0.92.0', client_side: 'required', server_side: 'required',
    versions: ['1.21.1', '1.20.4', '1.20.1'], loaders: ['fabric'],
  },
  // Adventure
  {
    project_id: 'mock-create', project_type: 'mod', slug: 'create', title: 'Create',
    description: 'A technology themed mod adding tools and components for automation and decoration.',
    author: 'simibubi', categories: ['adventure', 'technology', 'forge'], display_categories: ['adventure'],
    downloads: 25000000, icon_url: '', latest_version: '0.5.1', client_side: 'required', server_side: 'required',
    versions: ['1.21.1', '1.20.1', '1.19.2'], loaders: ['forge', 'neoforge', 'fabric'],
  },
  {
    project_id: 'mock-twilight-forest', project_type: 'mod', slug: 'twilight-forest', title: 'The Twilight Forest',
    description: 'A dimension exploration mod with new biomes, creatures, and dungeons.',
    author: 'Benimatic', categories: ['adventure', 'worldgen', 'forge'], display_categories: ['adventure'],
    downloads: 12000000, icon_url: '', latest_version: '4.5.0', client_side: 'required', server_side: 'required',
    versions: ['1.20.1', '1.19.2'], loaders: ['forge', 'neoforge'],
  },
  {
    project_id: 'mock-better-adventures', project_type: 'mod', slug: 'better-adventures', title: 'Better Adventures',
    description: 'Enhances exploration with new structures, loot, and world events.',
    author: 'Tschipp', categories: ['adventure', 'forge'], display_categories: ['adventure'],
    downloads: 2000000, icon_url: '', latest_version: '1.3.0', client_side: 'required', server_side: 'optional',
    versions: ['1.20.1'], loaders: ['forge'],
  },
  // Redstone
  {
    project_id: 'mock-project-red', project_type: 'mod', slug: 'project-red', title: 'Project Red',
    description: 'A redstone enhancement mod adding wires, gates, and circuit components.',
    author: 'MrTJP', categories: ['redstone', 'forge'], display_categories: ['redstone'],
    downloads: 3500000, icon_url: '', latest_version: '4.19.0', client_side: 'required', server_side: 'required',
    versions: ['1.20.1', '1.19.2'], loaders: ['forge'],
  },
  {
    project_id: 'mock-redstone-flux', project_type: 'mod', slug: 'redstone-flux', title: 'Redstone Flux',
    description: 'A power transmission API and mod for redstone-based energy systems.',
    author: 'TeamCoFH', categories: ['redstone', 'technology', 'forge'], display_categories: ['redstone'],
    downloads: 5000000, icon_url: '', latest_version: '1.5.0', client_side: 'optional', server_side: 'required',
    versions: ['1.20.1'], loaders: ['forge', 'neoforge'],
  },
  // Magic
  {
    project_id: 'mock-botania', project_type: 'mod', slug: 'botania', title: 'Botania',
    description: 'A magic-themed tech mod using natural flora for automation and power.',
    author: 'Vazkii', categories: ['magic', 'forge'], display_categories: ['magic'],
    downloads: 9000000, icon_url: '', latest_version: '447', client_side: 'required', server_side: 'required',
    versions: ['1.21.1', '1.20.1'], loaders: ['forge', 'neoforge', 'fabric'],
  },
  {
    project_id: 'mock-ars-nouveau', project_type: 'mod', slug: 'ars-nouveau', title: 'Ars Nouveau',
    description: 'A spell-crafting magic mod with glyphs and magical automation.',
    author: 'baileyholl', categories: ['magic', 'forge'], display_categories: ['magic'],
    downloads: 4000000, icon_url: '', latest_version: '5.3.0', client_side: 'required', server_side: 'required',
    versions: ['1.21.1', '1.20.1'], loaders: ['forge', 'neoforge'],
  },
  {
    project_id: 'mock-blood-magic', project_type: 'mod', slug: 'blood-magic', title: 'Blood Magic',
    description: 'A dark magic mod centered around blood rituals and soul networks.',
    author: 'WayofTime', categories: ['magic', 'forge'], display_categories: ['magic'],
    downloads: 3000000, icon_url: '', latest_version: '3.3.0', client_side: 'required', server_side: 'required',
    versions: ['1.20.1'], loaders: ['forge'],
  },
  // Technology
  {
    project_id: 'mock-mekanism', project_type: 'mod', slug: 'mekanism', title: 'Mekanism',
    description: 'A high-tech mod adding advanced machinery, tools, and energy systems.',
    author: 'aidancbrady', categories: ['technology', 'forge'], display_categories: ['technology'],
    downloads: 11000000, icon_url: '', latest_version: '10.7.0', client_side: 'required', server_side: 'required',
    versions: ['1.21.1', '1.20.1'], loaders: ['forge', 'neoforge'],
  },
  {
    project_id: 'mock-thermal-expansion', project_type: 'mod', slug: 'thermal-expansion', title: 'Thermal Expansion',
    description: 'A tech mod adding machines, dynamos, and RF-powered devices.',
    author: 'TeamCoFH', categories: ['technology', 'forge'], display_categories: ['technology'],
    downloads: 7000000, icon_url: '', latest_version: '10.3.0', client_side: 'required', server_side: 'required',
    versions: ['1.20.1'], loaders: ['forge', 'neoforge'],
  },
  {
    project_id: 'mock-industrial-foregoing', project_type: 'mod', slug: 'industrial-foregoing', title: 'Industrial Foregoing',
    description: 'An industrial mod with machines for farming, resource generation, and more.',
    author: 'Buuz135', categories: ['technology', 'forge'], display_categories: ['technology'],
    downloads: 5500000, icon_url: '', latest_version: '3.5.0', client_side: 'required', server_side: 'required',
    versions: ['1.20.1'], loaders: ['forge', 'neoforge'],
  },
  {
    project_id: 'mock-ae2', project_type: 'mod', slug: 'applied-energistics-2', title: 'Applied Energistics 2',
    description: 'A digital storage and autocrafting mod with ME network systems.',
    author: 'AlgorithmX2', categories: ['technology', 'forge'], display_categories: ['technology'],
    downloads: 8500000, icon_url: '', latest_version: '15.0.0', client_side: 'required', server_side: 'required',
    versions: ['1.21.1', '1.20.1'], loaders: ['forge', 'neoforge', 'fabric'],
  },
  // Decoration
  {
    project_id: 'mock-chisel', project_type: 'mod', slug: 'chisel', title: 'Chisel',
    description: 'A decoration mod adding hundreds of block variants and textures.',
    author: 'tterrag1098', categories: ['decoration', 'forge'], display_categories: ['decoration'],
    downloads: 4000000, icon_url: '', latest_version: '2.0.0', client_side: 'required', server_side: 'optional',
    versions: ['1.20.1'], loaders: ['forge'],
  },
  {
    project_id: 'mock-macaws-furniture', project_type: 'mod', slug: 'macaws-furniture', title: "Macaw's Furniture",
    description: 'Adds a wide variety of functional and decorative furniture blocks.',
    author: 'sketchmacaw', categories: ['decoration', 'forge'], display_categories: ['decoration'],
    downloads: 6500000, icon_url: '', latest_version: '3.2.0', client_side: 'required', server_side: 'optional',
    versions: ['1.21.1', '1.20.1'], loaders: ['forge', 'neoforge', 'fabric'],
  },
  {
    project_id: 'mock-supplementaries', project_type: 'mod', slug: 'supplementaries', title: 'Supplementaries',
    description: 'Vanilla-style decorative and functional additions for building and redstone.',
    author: 'MehVahdJukaar', categories: ['decoration', 'redstone', 'forge'], display_categories: ['decoration'],
    downloads: 5000000, icon_url: '', latest_version: '3.1.0', client_side: 'required', server_side: 'optional',
    versions: ['1.21.1', '1.20.1'], loaders: ['forge', 'neoforge', 'fabric'],
  },
  // Food
  {
    project_id: 'mock-farmers-delight', project_type: 'mod', slug: 'farmers-delight', title: "Farmer's Delight",
    description: 'A farming and cooking mod with new crops, meals, and kitchen utilities.',
    author: 'vectorwing', categories: ['food', 'forge'], display_categories: ['food'],
    downloads: 7500000, icon_url: '', latest_version: '1.2.0', client_side: 'required', server_side: 'required',
    versions: ['1.21.1', '1.20.1'], loaders: ['forge', 'neoforge', 'fabric'],
  },
  {
    project_id: 'mock-spice-of-life', project_type: 'mod', slug: 'spice-of-life', title: 'Spice of Life: Carrot Edition',
    description: 'Encourages dietary variety by rewarding players for eating different foods.',
    author: 'crazysnailboy', categories: ['food', 'forge'], display_categories: ['food'],
    downloads: 1500000, icon_url: '', latest_version: '1.12.0', client_side: 'required', server_side: 'required',
    versions: ['1.20.1'], loaders: ['forge'],
  },
  // Worldgen
  {
    project_id: 'mock-terralith', project_type: 'mod', slug: 'terralith', title: 'Terralith',
    description: 'A worldgen overhaul adding 95+ biomes using vanilla blocks and features.',
    author: 'Stardust', categories: ['worldgen', 'fabric'], display_categories: ['worldgen'],
    downloads: 5500000, icon_url: '', latest_version: '2.5.0', client_side: 'required', server_side: 'required',
    versions: ['1.21.1', '1.20.4', '1.20.1'], loaders: ['fabric', 'neoforge'],
  },
  {
    project_id: 'mock-biomes-o-plenty', project_type: 'mod', slug: 'biomes-o-plenty', title: "Biomes O' Plenty",
    description: 'Adds 80+ new biomes and terrain features for diverse world generation.',
    author: 'Forstride', categories: ['worldgen', 'forge'], display_categories: ['worldgen'],
    downloads: 9000000, icon_url: '', latest_version: '19.0.0', client_side: 'required', server_side: 'required',
    versions: ['1.21.1', '1.20.1'], loaders: ['forge', 'neoforge'],
  },
];

// ── Mock Modpack Database (10+ entries) ──────────────────────────────
const MOCK_MODPACKS_DB: any[] = [
  {
    project_id: 'modpack-fabulously-optimized', project_type: 'modpack', slug: 'fabulously-optimized', title: 'Fabulously Optimized',
    description: 'A performance-focused modpack with OptiFine parity and visual enhancements.',
    author: 'Madis0', categories: ['optimization', 'lightweight', 'fabric'], display_categories: ['optimization'],
    downloads: 5000000, icon_url: '', latest_version: '6.2.0', client_side: 'required', server_side: 'unsupported',
    versions: ['1.21.1', '1.20.4'], loaders: ['fabric'],
  },
  {
    project_id: 'modpack-atm9', project_type: 'modpack', slug: 'all-the-mods-9', title: 'All the Mods 9',
    description: 'A large kitchen-sink modpack with something for everyone.',
    author: 'ATMTeam', categories: ['large', 'forge'], display_categories: ['large'],
    downloads: 3000000, icon_url: '', latest_version: '0.3.0', client_side: 'required', server_side: 'required',
    versions: ['1.20.1'], loaders: ['forge'],
  },
  {
    project_id: 'modpack-create-above', project_type: 'modpack', slug: 'create-above-and-beyond', title: 'Create: Above and Beyond',
    description: 'A Create-centric adventure modpack with quests and automation challenges.',
    author: 'Simibubi', categories: ['technology', 'adventure', 'forge'], display_categories: ['technology'],
    downloads: 2000000, icon_url: '', latest_version: '1.5.0', client_side: 'required', server_side: 'required',
    versions: ['1.20.1'], loaders: ['forge'],
  },
  {
    project_id: 'modpack-rlcraft', project_type: 'modpack', slug: 'rlcraft', title: 'RLCraft',
    description: 'A hardcore survival modpack with realistic mechanics and danger around every corner.',
    author: 'Shivaxi', categories: ['large', 'adventure', 'forge'], display_categories: ['large'],
    downloads: 8000000, icon_url: '', latest_version: '2.9.0', client_side: 'required', server_side: 'required',
    versions: ['1.12.2'], loaders: ['forge'],
  },
  {
    project_id: 'modpack-vault-hunters', project_type: 'modpack', slug: 'vault-hunters', title: 'Vault Hunters',
    description: 'A multiplayer RPG modpack with vaults, loot, and skill progression.',
    author: 'iskall85', categories: ['multiplayer', 'adventure', 'forge'], display_categories: ['multiplayer'],
    downloads: 4000000, icon_url: '', latest_version: '1.18.2', client_side: 'required', server_side: 'required',
    versions: ['1.18.2'], loaders: ['forge'],
  },
  {
    project_id: 'modpack-sky-factory-4', project_type: 'modpack', slug: 'sky-factory-4', title: 'Sky Factory 4',
    description: 'A skyblock modpack with resource trees and automation from a single block.',
    author: 'Bacon_Donut', categories: ['technology', 'lightweight', 'forge'], display_categories: ['technology'],
    downloads: 3500000, icon_url: '', latest_version: '4.2.0', client_side: 'required', server_side: 'required',
    versions: ['1.12.2'], loaders: ['forge'],
  },
  {
    project_id: 'modpack-pixelmon', project_type: 'modpack', slug: 'pixelmon', title: 'Pixelmon Modpack',
    description: 'Catch, train, and battle Pokémon in Minecraft with this multiplayer modpack.',
    author: 'PixelmonMod', categories: ['multiplayer', 'adventure', 'forge'], display_categories: ['multiplayer'],
    downloads: 6000000, icon_url: '', latest_version: '9.2.0', client_side: 'required', server_side: 'required',
    versions: ['1.20.2'], loaders: ['forge'],
  },
  {
    project_id: 'modpack-better-mc', project_type: 'modpack', slug: 'better-mc', title: 'Better MC',
    description: 'An enhanced vanilla+ modpack that improves every aspect of Minecraft.',
    author: 'Lapito', categories: ['lightweight', 'adventure', 'fabric'], display_categories: ['lightweight'],
    downloads: 4500000, icon_url: '', latest_version: '3.1.0', client_side: 'required', server_side: 'required',
    versions: ['1.21.1', '1.20.1'], loaders: ['fabric'],
  },
  {
    project_id: 'modpack-enigmatica-9', project_type: 'modpack', slug: 'enigmatica-9', title: 'Enigmatica 9',
    description: 'A large expert-mode questing modpack with deep progression and automation.',
    author: 'EnigmaQuest', categories: ['large', 'technology', 'forge'], display_categories: ['large'],
    downloads: 1500000, icon_url: '', latest_version: '1.6.0', client_side: 'required', server_side: 'required',
    versions: ['1.20.1'], loaders: ['forge'],
  },
  {
    project_id: 'modpack-cottage-craft', project_type: 'modpack', slug: 'cottage-craft', title: 'Cottage Craft',
    description: 'A cozy, lightweight modpack focused on farming, cooking, and decoration.',
    author: 'CozyGamer', categories: ['lightweight', 'food', 'fabric'], display_categories: ['lightweight'],
    downloads: 800000, icon_url: '', latest_version: '2.0.0', client_side: 'required', server_side: 'optional',
    versions: ['1.21.1'], loaders: ['fabric'],
  },
  {
    project_id: 'modpack-divine-journey-2', project_type: 'modpack', slug: 'divine-journey-2', title: 'Divine Journey 2',
    description: 'A massive expert magic and tech modpack with 200+ mods and deep quests.',
    author: 'Morphan', categories: ['large', 'magic', 'forge'], display_categories: ['large'],
    downloads: 1200000, icon_url: '', latest_version: '1.10.0', client_side: 'required', server_side: 'required',
    versions: ['1.12.2'], loaders: ['forge'],
  },
  {
    project_id: 'modpack-medieval-mc', project_type: 'modpack', slug: 'medieval-mc', title: 'Medieval MC',
    description: 'A medieval-themed adventure modpack with magic, combat, and exploration.',
    author: 'Schlumpf', categories: ['adventure', 'magic', 'forge'], display_categories: ['adventure'],
    downloads: 2500000, icon_url: '', latest_version: '4.0.0', client_side: 'required', server_side: 'required',
    versions: ['1.20.1'], loaders: ['forge'],
  },
];

function mockInvoke(cmd: string, args: any): Promise<any> {
  switch (cmd) {
    case 'create_project': {
      const input = args.input;
      const id = `mock-${mockIdCounter++}`;
      const now = Date.now();
      const project = {
        id,
        name: input.name,
        description: input.description || '',
        mc_version: input.mc_version,
        loader: input.loader,
        author: input.author || '',
        tags: JSON.stringify(input.tags || []),
        created_at: now,
        updated_at: now,
      };
      mockProjects.set(id, project);
      mockMods.set(id, []);
      return Promise.resolve(project);
    }
    case 'list_projects':
      return Promise.resolve(Array.from(mockProjects.values()));
    case 'get_project':
      return Promise.resolve(mockProjects.get(args.id) || null);
    case 'delete_project': {
      mockProjects.delete(args.id);
      mockMods.delete(args.id);
      return Promise.resolve();
    }
    case 'update_project': {
      const project = mockProjects.get(args.id);
      if (!project) return Promise.reject(new Error('Project not found'));
      if (args.name !== undefined) project.name = args.name;
      if (args.description !== undefined) project.description = args.description;
      if (args.mc_version !== undefined) project.mc_version = args.mc_version;
      if (args.loader !== undefined) project.loader = args.loader;
      project.updated_at = Date.now();
      return Promise.resolve(project);
    }
    case 'add_mod_to_project': {
      const projectId = args.projectId;
      const input = args.input;
      const modId = `mod-${mockIdCounter++}`;
      const mod = {
        id: modId,
        project_id: projectId,
        modrinth_id: input.modrinth_id || null,
        slug: input.slug || null,
        name: input.name,
        version_id: input.version_id || null,
        version_number: input.version_number || null,
        icon_url: input.icon_url || null,
        description: input.description || null,
        author: input.author || null,
        source_url: input.source_url || null,
        license: input.license || null,
        homepage_url: input.homepage_url || null,
        supported_mc_versions: input.supported_mc_versions || [],
        changelog: input.changelog || null,
        added_at: Date.now(),
      };
      const mods = mockMods.get(projectId) || [];
      mods.push(mod);
      mockMods.set(projectId, mods);
      return Promise.resolve(mod);
    }
    case 'remove_mod_from_project': {
      const mods = mockMods.get(args.projectId) || [];
      mockMods.set(args.projectId, mods.filter((m: any) => m.id !== args.modId));
      return Promise.resolve();
    }
    case 'list_project_mods':
      return Promise.resolve(mockMods.get(args.projectId) || []);
    case 'save_dependencies':
      return Promise.resolve();
    case 'get_dependencies':
      return Promise.resolve(mockDeps.get(args.modId) || []);
    case 'fetch_and_save_dependencies': {
      const modrinthId = args.modrinthId as string;
      const projectModId = args.projectModId as string;
      const mockDepMap: Record<string, Array<{id: string; project_mod_id: string; depends_on_slug: string; dep_type: string; dep_modrinth_id: string | null}>> = {
        'mock-create': [
          { id: 'dep-1', project_mod_id: projectModId, depends_on_slug: 'flywheel', dep_type: 'required', dep_modrinth_id: 'mock-flywheel' },
          { id: 'dep-2', project_mod_id: projectModId, depends_on_slug: 'registrate', dep_type: 'required', dep_modrinth_id: 'mock-registrate' },
        ],
        'mock-sodium': [
          { id: 'dep-3', project_mod_id: projectModId, depends_on_slug: 'fabric-api', dep_type: 'required', dep_modrinth_id: 'mock-fabric-api' },
        ],
        'mock-iris': [
          { id: 'dep-4', project_mod_id: projectModId, depends_on_slug: 'sodium', dep_type: 'required', dep_modrinth_id: 'mock-sodium' },
        ],
      };
      const deps = mockDepMap[modrinthId] || [];
      // Store deps for get_all_dependencies
      const allDeps = mockDeps.get(args.projectId as string) || [];
      allDeps.push(...deps);
      mockDeps.set(args.projectId as string, allDeps);
      return Promise.resolve(deps);
    }
    case 'get_all_dependencies': {
      const allStored = mockDeps.get(args.projectId as string) || [];
      return Promise.resolve(allStored);
    }
    case 'search_mods': {
      const q = (args.query || '').toLowerCase().trim();
      let hits = MOCK_MODS_DB;
      if (q) {
        hits = MOCK_MODS_DB.filter((m: any) =>
          m.title.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
        );
      }
      return Promise.resolve({
        hits,
        total_hits: hits.length,
        offset: args.offset || 0,
        limit: args.limit || 10,
      });
    }
    case 'get_mod_details': {
      const id = args.modrinthId as string;
      const mockDetails: Record<string, any> = {
        'mock-sodium': {
          id: 'mock-sodium',
          slug: 'sodium',
          title: 'Sodium',
          description: 'Modern rendering engine for Minecraft that greatly improves frame rates and reduces stuttering.',
          source_url: 'https://github.com/CaffeineMC/sodium',
          license: { id: 'lgpl-3', name: 'GNU Lesser General Public License v3' },
          versions: ['1.21.1', '1.20.4', '1.20.1'],
          downloads: 15000000,
          icon_url: null,
        },
        'mock-iris': {
          id: 'mock-iris',
          slug: 'iris',
          title: 'Iris Shaders',
          description: 'A shader loader for Minecraft with Sodium support.',
          source_url: 'https://github.com/IrisShaders/Iris',
          license: { id: 'lgpl-3', name: 'GNU Lesser General Public License v3' },
          versions: ['1.21.1', '1.20.4'],
          downloads: 8000000,
          icon_url: null,
        },
        'mock-create': {
          id: 'mock-create',
          slug: 'create',
          title: 'Create',
          description: 'A technology themed mod that adds a variety of tools and components for automation and decoration.',
          source_url: 'https://github.com/Creators-of-Create/Create',
          license: { id: 'mit', name: 'MIT License' },
          versions: ['1.21.1', '1.20.1', '1.19.2'],
          downloads: 25000000,
          icon_url: null,
        },
      };
      return Promise.resolve(mockDetails[id] || null);
    }
    case 'get_mod_versions': {
      const id = args.modrinthId as string;
      const mockVersions: Record<string, any[]> = {
        'mock-sodium': [{
          id: 'ver-sodium-1',
          project_id: 'mock-sodium',
          name: 'Sodium 0.6.0',
          version_number: '0.6.0',
          changelog: '## Changes\n- Updated rendering pipeline\n- Fixed crash with Iris',
          dependencies: [
            { version_id: null, project_id: 'mock-fabric-api', file_name: null, dependency_type: 'required' },
          ],
          game_versions: ['1.21.1', '1.20.4'],
          loaders: ['fabric', 'neoforge'],
          files: [{ hashes: { sha1: 'abc' }, url: 'https://example.com/sodium.jar', filename: 'sodium-0.6.0.jar', primary: true, size: 1234567 }],
        }],
        'mock-iris': [{
          id: 'ver-iris-1',
          project_id: 'mock-iris',
          name: 'Iris 1.8.0',
          version_number: '1.8.0',
          changelog: '## Changes\n- Added shader pack support',
          dependencies: [
            { version_id: null, project_id: 'mock-sodium', file_name: null, dependency_type: 'required' },
          ],
          game_versions: ['1.21.1'],
          loaders: ['fabric'],
          files: [],
        }],
        'mock-create': [{
          id: 'ver-create-1',
          project_id: 'mock-create',
          name: 'Create 0.5.1',
          version_number: '0.5.1',
          changelog: '## Changes\n- New mechanical crafters\n- Fixed conveyor belt issues',
          dependencies: [
            { version_id: null, project_id: 'mock-flywheel', file_name: null, dependency_type: 'required' },
            { version_id: null, project_id: 'mock-registrate', file_name: null, dependency_type: 'required' },
          ],
          game_versions: ['1.21.1', '1.20.1'],
          loaders: ['forge', 'neoforge'],
          files: [],
        }],
      };
      return Promise.resolve(mockVersions[id] || []);
    }
    case 'import_modpack': {
      const id = `mock-${mockIdCounter++}`;
      const now = Date.now();
      const project = {
        id,
        name: 'Imported Pack',
        description: 'Imported from file',
        mc_version: '1.21.1',
        loader: 'neoforge',
        author: '',
        tags: '[]',
        created_at: now,
        updated_at: now,
      };
      mockProjects.set(id, project);
      mockMods.set(id, [
        { id: `mod-${mockIdCounter++}`, project_id: id, modrinth_id: null, slug: 'imported-mod-1', name: 'Imported Mod 1', version_number: '1.0', icon_url: null, description: 'Imported from pack', author: null, source_url: null, license: null },
        { id: `mod-${mockIdCounter++}`, project_id: id, modrinth_id: null, slug: 'imported-mod-2', name: 'Imported Mod 2', version_number: '2.0', icon_url: null, description: 'Imported from pack', author: null, source_url: null, license: null },
      ]);
      return Promise.resolve(project);
    }
    case 'search_modpacks': {
      const q = (args.query || '').toLowerCase().trim();
      let hits = MOCK_MODPACKS_DB;
      if (q) {
        hits = MOCK_MODPACKS_DB.filter((m: any) =>
          m.title.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
        );
      }
      return Promise.resolve({
        hits,
        total_hits: hits.length,
        offset: args.offset || 0,
        limit: args.limit || 10,
      });
    }
    case 'import_modpack_from_modrinth': {
      const id = `mock-${mockIdCounter++}`;
      const now = Date.now();
      const project = {
        id,
        name: 'Fabulously Optimized',
        description: 'A performance-focused modpack',
        mc_version: '1.21.1',
        loader: 'fabric',
        author: '',
        tags: '[]',
        created_at: now,
        updated_at: now,
      };
      mockProjects.set(id, project);
      mockMods.set(id, [
        { id: `mod-${mockIdCounter++}`, project_id: id, modrinth_id: 'mock-sodium', slug: 'sodium', name: 'Sodium', version_number: '0.6.0', icon_url: null, description: 'Modern rendering engine', author: 'jellysquid3', source_url: 'https://github.com/CaffeineMC/sodium', license: 'lgpl-3' },
        { id: `mod-${mockIdCounter++}`, project_id: id, modrinth_id: 'mock-iris', slug: 'iris', name: 'Iris Shaders', version_number: '1.8.0', icon_url: null, description: 'Shader loader', author: 'coderbot', source_url: null, license: null },
        { id: `mod-${mockIdCounter++}`, project_id: id, modrinth_id: 'mock-fabric-api', slug: 'fabric-api', name: 'Fabric API', version_number: '0.92.0', icon_url: null, description: 'Fabric mod loader API', author: 'modmuss50', source_url: 'https://github.com/FabricMC/fabric', license: 'apache-2.0' },
      ]);
      return Promise.resolve(project);
    }
    case 'get_modpack_contents': {
      return Promise.resolve({
        name: 'Fabulously Optimized',
        description: 'A performance-focused modpack with OptiFine parity.',
        mc_version: '1.21.1',
        loader: 'fabric',
        icon_url: null,
        downloads: 5000000,
        mods: [
          { project_id: 'mock-sodium', name: 'Sodium', slug: 'sodium', icon_url: null, description: 'Modern rendering engine for Minecraft', dep_type: 'required' },
          { project_id: 'mock-iris', name: 'Iris Shaders', slug: 'iris', icon_url: null, description: 'Shader loader for Sodium', dep_type: 'required' },
          { project_id: 'mock-fabric-api', name: 'Fabric API', slug: 'fabric-api', icon_url: null, description: 'Fabric mod loader API', dep_type: 'required' },
          { project_id: 'mock-lithium', name: 'Lithium', slug: 'lithium', icon_url: null, description: 'General-purpose optimization mod', dep_type: 'optional' },
        ],
      });
    }
    case 'search_mods_by_category': {
      const category = (args.category || '').toLowerCase();
      const loaders = args.loaders as string[] | undefined;
      const gameVersions = args.gameVersions as string[] | undefined;
      let hits = MOCK_MODS_DB;
      if (category === 'popular') {
        hits = [...MOCK_MODS_DB].sort((a: any, b: any) => b.downloads - a.downloads);
      } else if (category === 'newest') {
        hits = [...MOCK_MODS_DB].sort((a: any, b: any) => b.downloads - a.downloads).reverse();
      } else {
        hits = MOCK_MODS_DB.filter((m: any) => m.categories.includes(category));
      }
      if (loaders && loaders.length > 0) {
        hits = hits.filter((m: any) => m.loaders.some((l: string) => loaders.includes(l)));
      }
      if (gameVersions && gameVersions.length > 0) {
        hits = hits.filter((m: any) => m.versions.some((v: string) => gameVersions.includes(v)));
      }
      return Promise.resolve({
        hits,
        total_hits: hits.length,
        offset: args.page || 0,
        limit: 20,
      });
    }
    case 'search_modpacks_by_category': {
      const category = (args.category || '').toLowerCase();
      let hits = MOCK_MODPACKS_DB;
      if (category === 'popular') {
        hits = [...MOCK_MODPACKS_DB].sort((a: any, b: any) => b.downloads - a.downloads);
      } else if (category === 'newest') {
        hits = [...MOCK_MODPACKS_DB].sort((a: any, b: any) => b.downloads - a.downloads).reverse();
      } else {
        hits = MOCK_MODPACKS_DB.filter((m: any) => m.categories.includes(category));
      }
      return Promise.resolve({
        hits,
        total_hits: hits.length,
        offset: args.page || 0,
        limit: 20,
      });
    }
    case 'export_pack':
      return Promise.resolve('Mock export completed');
    default:
      return Promise.reject(new Error(`Unknown command: ${cmd}`));
  }
}

async function callInvoke(cmd: string, args: any): Promise<any> {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke(cmd, args);
  }
  return mockInvoke(cmd, args);
}

import type {
  Project, ProjectInput, ProjectMod, ModInput,
  Dependency, DepInput,
  ModrinthSearchResult, ModrinthVersion,
  ModpackContent,
} from '../types';

// Project commands
export const createProject = (input: ProjectInput): Promise<Project> =>
  callInvoke('create_project', { input });

export const listProjects = (): Promise<Project[]> =>
  callInvoke('list_projects', {});

export const getProject = (id: string): Promise<Project> =>
  callInvoke('get_project', { id });

export const deleteProject = (id: string): Promise<void> =>
  callInvoke('delete_project', { id });

export const updateProject = (id: string, updates: { name?: string; description?: string; mc_version?: string; loader?: string }): Promise<Project> =>
  callInvoke('update_project', { id, ...updates });

// Mod commands
export const addModToProject = (projectId: string, input: ModInput): Promise<ProjectMod> =>
  callInvoke('add_mod_to_project', { projectId, input });

export const removeModFromProject = (projectId: string, modId: string): Promise<void> =>
  callInvoke('remove_mod_from_project', { projectId, modId });

export const listProjectMods = (projectId: string): Promise<ProjectMod[]> =>
  callInvoke('list_project_mods', { projectId });

// Dependency commands
export const saveDependencies = (modId: string, deps: DepInput[]): Promise<void> =>
  callInvoke('save_dependencies', { modId, deps });

export const getDependencies = (modId: string): Promise<Dependency[]> =>
  callInvoke('get_dependencies', { modId });

export const getAllDependencies = (projectId: string): Promise<Dependency[]> =>
  callInvoke('get_all_dependencies', { projectId });

// Search commands
interface SearchFilters {
  loaders?: string[];
  game_versions?: string[];
}

export const searchMods = (query: string, filters?: SearchFilters, limit?: number, offset?: number): Promise<ModrinthSearchResult> =>
  callInvoke('search_mods', { query, filters, limit, offset });

export const getModDetails = (modrinthId: string): Promise<any> =>
  callInvoke('get_mod_details', { modrinthId });

export const getModVersions = (modrinthId: string, mcVersion?: string, loader?: string): Promise<ModrinthVersion[]> =>
  callInvoke('get_mod_versions', { modrinthId, mcVersion, loader });

// Fetch and save dependencies automatically
export const fetchAndSaveDependencies = (
  modrinthId: string,
  mcVersion: string,
  loader: string,
  projectModId: string
): Promise<Dependency[]> =>
  callInvoke('fetch_and_save_dependencies', { modrinthId, mcVersion, loader, projectModId });

// Import modpack from file
export const importModpack = (filePath: string): Promise<Project> =>
  callInvoke('import_modpack', { filePath });

// Search modpacks on Modrinth
export const searchModpacks = (query: string, gameVersions?: string[], limit?: number, offset?: number): Promise<ModrinthSearchResult> =>
  callInvoke('search_modpacks', { query, gameVersions, limit, offset });

// Import modpack from Modrinth
export const importModpackFromModrinth = (modrinthId: string): Promise<Project> =>
  callInvoke('import_modpack_from_modrinth', { modrinthId });

// Preview modpack contents from Modrinth
export const getModpackContents = (modrinthId: string): Promise<ModpackContent> =>
  callInvoke('get_modpack_contents', { modrinthId });

// Search mods by category
export const searchModsByCategory = (category: string, loaders?: string[], gameVersions?: string[], page?: number): Promise<ModrinthSearchResult> =>
  callInvoke('search_mods_by_category', { category, loaders, gameVersions, page: page ?? 0 });

// Search modpacks by category
export const searchModpacksByCategory = (category: string, page?: number): Promise<ModrinthSearchResult> =>
  callInvoke('search_modpacks_by_category', { category, page: page ?? 0 });
