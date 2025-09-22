import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadoutService } from './services/loadoutService';
import { urlService } from './services/urlService';
import DualToolbar from './components/DualToolbar';
import DualEquipmentLayout from './components/DualEquipmentLayout';
import ApolloProviderWrapper from './components/ApolloProviderWrapper';
import ErrorBoundary from './components/ErrorBoundary';
import { loadoutEventEmitter } from './services/loadoutEventEmitter';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [characterLoaded, setCharacterLoaded] = useState<boolean>(false);

  // Set up URL service navigation callback
  useEffect(() => {
    urlService.setNavigateCallback(navigate);
  }, [navigate]);

  // Subscribe to URL-related events
  useEffect(() => {
    const unsubscribe = loadoutEventEmitter.subscribe('CHARACTER_LOADED_FROM_URL', () => {
      // Handle any UI updates needed when character is loaded from URL
      setCharacterLoaded(true);
    });

    const unsubscribe2 = loadoutEventEmitter.subscribe('CHARACTER_LOADED', () => {
      // Handle any UI updates needed when character is loaded from button
      setCharacterLoaded(true);
    });

    return () => {
      unsubscribe();
      unsubscribe2();
    };
  }, []);

  // Listen to loadout changes and handle character loadout switching
  useEffect(() => {
    const unsubscribe = loadoutService.subscribeToAllEvents((event) => {
      // If a character was loaded and we're now modifying the loadout, switch to regular loadout
      if (characterLoaded && (
        event.type === 'ITEM_UPDATED' ||
        event.type === 'TALISMAN_UPDATED' ||
        event.type === 'CAREER_CHANGED' ||
        event.type === 'LEVEL_CHANGED' ||
        event.type === 'RENOWN_RANK_CHANGED'
      )) {
        setCharacterLoaded(false);
      }
    });

    return unsubscribe;
  }, [characterLoaded]);

  // Handle URL parameters on app initialization
  useEffect(() => {
    const keys = Array.from(urlService.getSearchParams().keys());
    const loadCharacter = urlService.getParam('loadCharacter');
    const hasLoadoutParams = urlService.getParam('career') || urlService.getParam('level') ||
                             keys.some(key => key.startsWith('item.') || key.startsWith('talisman.'));
    const hasCompareParams = urlService.getParam('mode') === 'dual' ||
                             keys.some(key => key.startsWith('a.') || key.startsWith('b.') || key === 'loadCharacterA' || key === 'loadCharacterB');

    if (hasCompareParams) {
      // Load dual compare state from URL
      urlService.handleCompareFromUrl()
        .then(() => setErrorMessage(''))
        .catch((error) => setErrorMessage(`Failed to load compare from URL: ${(error as Error).message}`));
    } else if (loadCharacter) {
      // Load character from URL parameter
      urlService.handleCharacterFromUrl(loadCharacter)
        .then(() => {
          setErrorMessage(''); // Clear any previous error
        })
        .catch((error) => {
          setErrorMessage(`Failed to load character "${loadCharacter}" from URL: ${(error as Error).message}`);
        });
    } else if (hasLoadoutParams) {
      // Load loadout from URL parameters
      urlService.handleLoadoutFromUrlParams()
        .then(() => {
          setErrorMessage(''); // Clear any previous error
        })
        .catch((error) => {
          setErrorMessage(`Failed to load loadout from URL parameters: ${(error as Error).message}`);
        });
    } else {
      // Default path: ensure dual compare mode has both sides initialized
      try {
        loadoutService.ensureSideLoadout('A');
        loadoutService.ensureSideLoadout('B');
      } catch (error) {
        console.error('Failed to initialize compare loadouts:', error);
      }
    }
  }, []);

  // Handle URL changes (when user navigates back/forward or pastes new URL)
  useEffect(() => {
    const keys = Array.from(urlService.getSearchParams().keys());
    const loadCharacter = urlService.getParam('loadCharacter');
    const hasLoadoutParams = urlService.getParam('career') || urlService.getParam('level') ||
                             keys.some(key => key.startsWith('item.') || key.startsWith('talisman.'));
    const hasCompareParams = urlService.getParam('mode') === 'dual' ||
                             keys.some(key => key.startsWith('a.') || key.startsWith('b.') || key === 'loadCharacterA' || key === 'loadCharacterB');

    // Only load if there are parameters and we're not in an error state
    if (hasCompareParams && !errorMessage.includes('Failed to load compare')) {
      urlService.handleCompareFromUrl()
        .then(() => setErrorMessage(''))
        .catch((error) => setErrorMessage(`Failed to load compare from URL: ${(error as Error).message}`));
    } else if (loadCharacter && !errorMessage.includes('Failed to load character')) {
      urlService.handleCharacterFromUrl(loadCharacter)
        .then(() => {
          setErrorMessage(''); // Clear any previous error
        })
        .catch((error) => {
          setErrorMessage(`Failed to load character "${loadCharacter}" from URL: ${(error as Error).message}`);
        });
    } else if (hasLoadoutParams && !errorMessage.includes('Failed to load loadout')) {
      urlService.handleLoadoutFromUrlParams()
        .then(() => {
          setErrorMessage(''); // Clear any previous error
        })
        .catch((error) => {
          setErrorMessage(`Failed to load loadout from URL parameters: ${(error as Error).message}`);
        });
    }
  }, [location.search, errorMessage]); // Re-run when URL search params change or error state changes

  return (
    <ErrorBoundary>
      <ApolloProviderWrapper>
        <div className="min-h-screen bg-gray-100 dark:bg-[var(--background)] p-4">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary">RorPlanner</h1>
          </header>
          <div className="max-w-6xl mx-auto">
            <DualToolbar />
            <DualEquipmentLayout />
          </div>
        </div>
      </ApolloProviderWrapper>
    </ErrorBoundary>
  );
}

export default App;
