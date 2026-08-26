import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadoutService } from './services/loadout/loadoutService';
import { urlService } from './services/loadout/urlService';
import DualToolbar from './components/toolbar/DualToolbar';
import DualEquipmentLayout from './components/panels/DualEquipmentLayout';
import ScaleToFit from './components/layout/ScaleToFit';
import LayoutModeToggle from './components/layout/LayoutModeToggle';
import { LayoutModeProvider, useLayoutMode } from './hooks/useLayoutMode';
import ApolloProviderWrapper from './providers/ApolloProvider';
import ErrorBoundary from './providers/ErrorBoundary';
import { preloadCareerIcons } from './constants/careerIcons';
import { DESIGN_WIDTH, SCALE_MAX, SCALE_MIN, TABLET_SCALE_FLOOR } from './constants/ui';
// Presentation layer should subscribe through the service API, not the raw emitter

function AppHeader() {
  const { layoutMode } = useLayoutMode();
  if (layoutMode === 'tablet') {
    return (
      <header className="relative text-center mb-6">
        <h1 className="text-4xl font-bold text-primary font-brand">RorPlanner</h1>
        <nav className="mt-3 flex items-center justify-between gap-2">
          <a
            href="https://rorleaderboard.pages.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="header-link inline-flex items-center text-xs italic text-muted hover:underline"
          >
            Leaderboard
          </a>
          <LayoutModeToggle />
          <a
            href="https://discord.com/users/316636548353490944"
            target="_blank"
            rel="noopener noreferrer"
            className="header-link inline-flex items-center text-xs italic text-muted hover:underline"
          >
            Feedback
          </a>
        </nav>
      </header>
    );
  }
  return (
    <header className="relative text-center mb-8">
      <h1 className="text-4xl font-bold text-primary font-brand">RorPlanner</h1>
      <a
        href="https://rorleaderboard.pages.dev/"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute left-0 top-0 inline-flex items-center gap-1.5 text-xs italic text-muted hover:underline"
      >
        Leaderboard
      </a>
      <div className="absolute right-4 top-0 flex items-center gap-3">
        <LayoutModeToggle />
        <a
          href="https://discord.com/users/316636548353490944"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs italic text-muted hover:underline"
        >
          Feedback
        </a>
      </div>
    </header>
  );
}

function AppShell() {
  const { layoutMode, useTabs, useScaledCanvas } = useLayoutMode();
  const minScale = layoutMode === 'tablet' ? TABLET_SCALE_FLOOR : SCALE_MIN;
  const content = (
    <>
      <AppHeader />
      {!useTabs && <DualToolbar />}
      <DualEquipmentLayout />
    </>
  );

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.layout = layoutMode;
    root.dataset.tabletTabs = useTabs ? 'true' : 'false';
    return () => {
      delete root.dataset.layout;
      delete root.dataset.tabletTabs;
    };
  }, [layoutMode, useTabs]);

  return (
    <div
      className={`min-h-screen py-4 ${useTabs ? 'px-3 max-w-[1440px] mx-auto' : ''}`}
      data-layout={layoutMode}
      data-tablet-tabs={useTabs ? 'true' : 'false'}
    >
      {useScaledCanvas ? (
        <ScaleToFit designWidth={DESIGN_WIDTH} minScale={minScale} maxScale={SCALE_MAX}>
          {content}
        </ScaleToFit>
      ) : (
        content
      )}
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [characterLoaded, setCharacterLoaded] = useState<boolean>(false);

  // Set up URL service navigation callback
  useEffect(() => {
    urlService.setNavigateCallback(navigate);
  }, [navigate]);

  // Explicitly disable automatic URL mutation and navigation-driven parsing by default
  useEffect(() => {
    urlService.setAutoUpdateEnabled(false);
    urlService.setNavigationHandlingEnabled(false);
  }, []);

  // Subscribe to URL-related events
  useEffect(() => {
    const unsub1 = loadoutService.subscribeToEvents('CHARACTER_LOADED_FROM_URL', () => {
      setCharacterLoaded(true);
    });
    const unsub2 = loadoutService.subscribeToEvents('CHARACTER_LOADED', () => {
      setCharacterLoaded(true);
    });
    return () => {
      unsub1();
      unsub2();
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
    // Warm up external career icon images in the background.
    preloadCareerIcons();

    const keys = Array.from(urlService.getSearchParams().keys());
    const hasCompareParams = keys.some(key => key.startsWith('a.') || key.startsWith('b.') || key === 'loadCharacterA' || key === 'loadCharacterB');

    if (hasCompareParams) {
      // Load dual compare state from URL
      urlService.handleCompareFromUrl()
        .then(() => setErrorMessage(''))
        .catch((error) => setErrorMessage(`Failed to load compare from URL: ${(error as Error).message}`));
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
    // Respect feature flag: by default, do not handle URL changes after initial load
    if (!urlService.isNavigationHandlingEnabled()) return;
    const keys = Array.from(urlService.getSearchParams().keys());
    const hasCompareParams = keys.some(key => key.startsWith('a.') || key.startsWith('b.') || key === 'loadCharacterA' || key === 'loadCharacterB');

    // Only load if there are parameters and we're not in an error state
    if (hasCompareParams && !errorMessage.includes('Failed to load compare')) {
      urlService.handleCompareFromUrl()
        .then(() => setErrorMessage(''))
        .catch((error) => setErrorMessage(`Failed to load compare from URL: ${(error as Error).message}`));
    }
  }, [location.search, errorMessage]); // Re-run when URL search params change or error state changes

  return (
    <ErrorBoundary>
      <ApolloProviderWrapper>
        <LayoutModeProvider>
          <AppShell />
        </LayoutModeProvider>
      </ApolloProviderWrapper>
    </ErrorBoundary>
  );
}

export default App;
