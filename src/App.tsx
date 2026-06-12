import { Sidebar } from './components/layout/Sidebar';
import { Canvas } from './components/layout/Canvas';
import { Inspector } from './components/layout/Inspector';

export default function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <Canvas />
      <Inspector />
    </div>
  );
}
