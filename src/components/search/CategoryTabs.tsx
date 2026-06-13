import { useTranslation } from 'react-i18next';

interface CategoryTabsProps {
  categories: string[];
  active: string;
  onSelect: (category: string) => void;
}

const CATEGORY_KEYS: Record<string, string> = {
  popular: 'search.categories.popular',
  newest: 'search.categories.newest',
  optimization: 'search.categories.optimization',
  adventure: 'search.categories.adventure',
  redstone: 'search.categories.redstone',
  magic: 'search.categories.magic',
  technology: 'search.categories.technology',
  decoration: 'search.categories.decoration',
  food: 'search.categories.food',
  worldgen: 'search.categories.worldgen',
  lightweight: 'search.categories.lightweight',
  large: 'search.categories.large',
  multiplayer: 'search.categories.multiplayer',
};

export function CategoryTabs({ categories, active, onSelect }: CategoryTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 px-5 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className="shrink-0 px-4 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200"
          style={{
            background: active === cat ? 'rgba(10,132,255,0.2)' : 'rgba(255,255,255,0.06)',
            border: active === cat ? '1px solid rgba(10,132,255,0.4)' : '1px solid transparent',
            color: active === cat ? '#0a84ff' : '#86868b',
          }}
        >
          {t(CATEGORY_KEYS[cat] || cat)}
        </button>
      ))}
    </div>
  );
}
