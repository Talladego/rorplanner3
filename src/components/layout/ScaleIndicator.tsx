import { useScale } from './ScaleContext';

export default function ScaleIndicator() {
  const scale = useScale();
  const label = `x${scale.toFixed(2)}`;
  return (
    <div
      className="fixed top-2 left-2 z-[12000] px-1.5 py-0.5 rounded bg-black/50 text-white text-[10px] font-semibold pointer-events-none select-none"
      aria-label="UI scale indicator"
    >
      {label}
    </div>
  );
}
