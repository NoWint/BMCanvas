interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-[#1C1C1E] mb-4" style={{ fontFamily: '"SF Pro Display", "Inter Tight", system-ui, sans-serif' }}>Discover Mods</h2>
      <p className="text-[#8E8E93]">Search will be implemented in Slice 2</p>
    </div>
  );
}
