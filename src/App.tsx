import { useEffect, Component, ReactNode, ErrorInfo } from 'react';
import { loadoutService } from './services/loadoutService';
import Toolbar from './components/Toolbar';
import EquipmentPanel from './components/EquipmentPanel';
import StatsPanel from './components/StatsPanel';
import ApolloProviderWrapper from './components/ApolloProviderWrapper';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-100 p-8">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Something went wrong</h1>
          <pre className="bg-red-50 p-4 rounded text-red-700 whitespace-pre-wrap">
            {this.state.error?.toString()}
          </pre>
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  useEffect(() => {
    console.log('App useEffect running');
    // Create a default loadout if none exists
    try {
      console.log('Initializing app...');
      // Check if we have a current loadout, if not create one
      const currentLoadout = loadoutService.getCurrentLoadout();
      console.log('Current loadout:', currentLoadout);
      if (!currentLoadout) {
        console.log('Creating default loadout...');
        loadoutService.createLoadout('Default Loadout');
        console.log('Default loadout created');
      }
    } catch (error) {
      console.error('Failed to initialize default loadout:', error);
    }
  }, []);

  return (
    <ErrorBoundary>
      <ApolloProviderWrapper>
        <div className="min-h-screen bg-gray-100 dark:bg-[var(--background)] p-4">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary">RorPlanner</h1>
          </header>
          <div className="max-w-6xl mx-auto">
            <Toolbar />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <EquipmentPanel />
              </div>
              <div className="lg:col-span-1">
                <StatsPanel />
              </div>
            </div>
          </div>
        </div>
      </ApolloProviderWrapper>
    </ErrorBoundary>
  );
}

export default App;
