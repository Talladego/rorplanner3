import { useLayoutMode } from '../../hooks/useLayoutMode';

export default function LayoutModeToggle() {
  const { layoutMode, toggleLayoutMode } = useLayoutMode();
  const label = layoutMode === 'tablet' ? 'Desktop site' : 'Tablet site';
  return (
    <button
      type="button"
      onClick={toggleLayoutMode}
      className="layout-mode-toggle text-xs italic text-muted hover:underline"
      aria-label={layoutMode === 'tablet' ? 'Switch to desktop layout' : 'Switch to tablet layout'}
    >
      {label}
    </button>
  );
}
