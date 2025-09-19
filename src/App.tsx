import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadoutService } from './services/loadoutService';
import { urlService } from './services/urlService';
import Toolbar from './components/Toolbar';
import EquipmentPanel from './components/EquipmentPanel';
import StatsPanel from './components/StatsPanel';
import ApolloProviderWrapper from './components/ApolloProviderWrapper';
import ErrorBoundary from './components/ErrorBoundary';
import { Career } from './types';
import { CharacterLoadedFromUrlEvent, CharacterLoadedEvent } from './types/events';
import { loadoutEventEmitter } from './services/loadoutEventEmitter';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCareer, setSelectedCareer] = useState<Career | ''>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [characterLoaded, setCharacterLoaded] = useState<boolean>(false);

  // Set up URL service navigation callback
  useEffect(() => {
    urlService.setNavigateCallback(navigate);
  }, [navigate]);

  // Subscribe to URL-related events
  useEffect(() => {
    const unsubscribe = loadoutEventEmitter.subscribe('CHARACTER_LOADED_FROM_URL', (event: CharacterLoadedFromUrlEvent) => {
      // Handle any UI updates needed when character is loaded from URL
      console.log(`Character loaded from URL: ${event.payload.characterName}`);
      setCharacterLoaded(true);
    });

    const unsubscribe2 = loadoutEventEmitter.subscribe('CHARACTER_LOADED', (event: CharacterLoadedEvent) => {
      // Handle any UI updates needed when character is loaded from button
      console.log(`Character loaded from button: ${event.payload.characterName}`);
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
        console.log('Switched from character loadout to regular loadout due to modifications');
      }
    });

    return unsubscribe;
  }, [characterLoaded]);

  // Handle URL parameters on app initialization
  useEffect(() => {
    const loadCharacter = urlService.getParam('loadCharacter');
    const hasLoadoutParams = urlService.getParam('career') || urlService.getParam('level') || 
                            Array.from(urlService.getSearchParams().keys()).some(key => 
                              key.startsWith('item.') || key.startsWith('talisman.'));

    if (loadCharacter) {
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
      // Create a default loadout if none exists
      try {
        // Check if we have a current loadout, if not create one
        const currentLoadout = loadoutService.getCurrentLoadout();
        if (!currentLoadout) {
          loadoutService.createLoadout('Default Loadout');
        }
      } catch (error) {
        console.error('Failed to initialize default loadout:', error);
      }
    }
  }, []);

  // Handle URL changes (when user navigates back/forward or pastes new URL)
  useEffect(() => {
    const loadCharacter = urlService.getParam('loadCharacter');
    const hasLoadoutParams = urlService.getParam('career') || urlService.getParam('level') || 
                            Array.from(urlService.getSearchParams().keys()).some(key => 
                              key.startsWith('item.') || key.startsWith('talisman.'));

    // Only load if there are parameters and we're not in an error state
    if (loadCharacter && !errorMessage.includes('Failed to load character')) {
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
  }, [location.search]); // Re-run when URL search params change

  return (
    <ErrorBoundary>
      <ApolloProviderWrapper>
        <div className="min-h-screen bg-gray-100 dark:bg-[var(--background)] p-4">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary">RorPlanner</h1>
          </header>
          <div className="max-w-6xl mx-auto">
            <Toolbar
              selectedCareer={selectedCareer}
              setSelectedCareer={setSelectedCareer}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <EquipmentPanel selectedCareer={selectedCareer} />
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
