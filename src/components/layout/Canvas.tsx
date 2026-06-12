import { useState } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { ProjectList } from '../project/ProjectList';
import { ProjectCreate } from '../project/ProjectCreate';
import { SearchBar } from '../search/SearchBar';
import { SearchResults } from '../search/SearchResults';

export function Canvas() {
  const activeView = useUiStore((s) => s.activeView);
  const currentProject = useProjectStore((s) => s.currentProject);
  const [searchQuery, setSearchQuery] = useState('');

  const renderContent = () => {
    switch (activeView) {
      case 'projects':
        return (
          <div className="p-6 max-w-3xl mx-auto">
            <ProjectCreate />
            <ProjectList />
          </div>
        );
      case 'discover':
        return (
          <div className="p-6 max-w-4xl mx-auto">
            <SearchBar onSearch={setSearchQuery} />
            <SearchResults query={searchQuery} />
          </div>
        );
      case 'graph':
        return (
          <div className="h-full flex items-center justify-center text-[#AEAEB2]">
            {currentProject
              ? 'Graph view — will be implemented in Slice 3'
              : 'Select a project to view its dependency graph'}
          </div>
        );
      case 'diagnostics':
        return (
          <div className="p-6 max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold text-[#1C1C1E] mb-4" style={{ fontFamily: '"SF Pro Display", "Inter Tight", system-ui, sans-serif' }}>Diagnostics</h2>
            <p className="text-[#8E8E93]">Will be implemented in Slice 4</p>
          </div>
        );
      case 'export':
        return (
          <div className="p-6 max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold text-[#1C1C1E] mb-4" style={{ fontFamily: '"SF Pro Display", "Inter Tight", system-ui, sans-serif' }}>Export</h2>
            <p className="text-[#8E8E93]">Will be implemented in Slice 5</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 h-full bg-[#F2F2F7] overflow-auto">
      {renderContent()}
    </main>
  );
}
