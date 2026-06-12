import { useState } from 'react';

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
      <h2 className="text-xl font-semibold text-text-primary mb-4 font-heading">Discover Mods</h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search mods on Modrinth..."
          className="flex-1 px-4 py-2.5 bg-surface rounded-lg border border-separator text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="px-5 py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          Search
        </button>
      </form>
    </div>
  );
}
