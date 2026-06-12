import { useReactFlow } from 'reactflow';

export function GraphControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-3 right-3 flex gap-1 z-10">
      <button
        onClick={() => zoomIn({ duration: 200 })}
        className="flex items-center justify-center w-7 h-7 rounded bg-[#18181B]/80 border border-[#27272A] text-[#71717A] text-xs backdrop-blur-sm hover:text-[#FAFAFA] hover:border-[#3F3F46] transition-colors duration-100"
        title="Zoom In"
      >
        +
      </button>
      <button
        onClick={() => zoomOut({ duration: 200 })}
        className="flex items-center justify-center w-7 h-7 rounded bg-[#18181B]/80 border border-[#27272A] text-[#71717A] text-xs backdrop-blur-sm hover:text-[#FAFAFA] hover:border-[#3F3F46] transition-colors duration-100"
        title="Zoom Out"
      >
        −
      </button>
      <button
        onClick={() => fitView({ padding: 0.2, duration: 300 })}
        className="flex items-center justify-center w-7 h-7 rounded bg-[#18181B]/80 border border-[#27272A] text-[#71717A] text-xs backdrop-blur-sm hover:text-[#FAFAFA] hover:border-[#3F3F46] transition-colors duration-100"
        title="Fit View"
      >
        ⊞
      </button>
    </div>
  );
}
