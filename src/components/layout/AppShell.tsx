import { GraphCanvas } from '../graph/GraphCanvas';
import { ModListPanel } from './ModListPanel';
import { StatusBar } from './StatusBar';
import { InspectorPanel } from '../panels/InspectorPanel';
import { useUIStore } from '../../stores/uiStore';

export function AppShell() {
  const inspectorOpen = useUIStore((s) => s.inspectorOpen);

  return (
    <div className="flex flex-col h-screen bg-[#000000]">
      <div className="flex flex-1 overflow-hidden">
        <ModListPanel />
        <GraphCanvas />
        {inspectorOpen && <InspectorPanel />}
      </div>
      <StatusBar />
    </div>
  );
}
