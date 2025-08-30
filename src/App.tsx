import { useEffect } from 'react';
import { loadoutService } from './services/loadoutService';
import Toolbar from './components/Toolbar';
import EquipmentPanel from './components/EquipmentPanel';
import StatsPanel from './components/StatsPanel';
import ApolloProviderWrapper from './components/ApolloProviderWrapper';

function App() {
  useEffect(() => {
    // Create a default loadout if none exists
    const loadouts = loadoutService.getAllLoadouts();
    if (loadouts.length === 0) {
      loadoutService.createLoadout('Default Loadout');
    }
  }, []);

  return (
    <ApolloProviderWrapper>
      <div className="min-h-screen bg-gray-100 dark:bg-[var(--background)] p-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary">RorPlanner</h1>
        </header>
        <div className="max-w-6xl mx-auto">
          <Toolbar />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <EquipmentPanel />
            <StatsPanel />
          </div>
        </div>
      </div>
    </ApolloProviderWrapper>
  );
}

export default App;
