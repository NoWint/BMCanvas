import { useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div>
      <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">Discover Mods</h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search mods on Modrinth..."
            className="w-full pl-9 pr-3 py-2.5 bg-surface rounded-lg border border-separator text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim()}
          className="px-5 py-2.5 bg-accent text-bg font-medium text-sm rounded-lg hover:bg-accent-light disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98]"
        >
          Search
        </button>
      </form>
    </div>
  );
}
