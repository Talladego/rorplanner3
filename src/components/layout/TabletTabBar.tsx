import { useLayoutMode } from '../../hooks/useLayoutMode';
import type { TabletTab } from '../../utils/layoutMode';

interface TabletTabBarProps {
  value: TabletTab;
  onChange: (tab: TabletTab) => void;
}

const TABS: { id: TabletTab; label: string }[] = [
  { id: 'A', label: 'A' },
  { id: 'compare', label: 'Compare' },
  { id: 'B', label: 'B' },
];

export default function TabletTabBar({ value, onChange }: TabletTabBarProps) {
  const { layoutMode } = useLayoutMode();
  if (layoutMode !== 'tablet') return null;
  return (
    <div
      role="tablist"
      aria-label="Loadout panels"
      className="tablet-tab-bar mb-4 grid grid-cols-3 gap-1 p-1 rounded-lg"
    >
      {TABS.map((tab) => {
        const selected = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`tablet-tab ${selected ? 'tablet-tab-active' : ''}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
