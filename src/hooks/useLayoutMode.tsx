/* eslint-disable react-refresh/only-export-components -- provider + hook share one context module */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { urlService } from '../services/loadout/urlService';
import {
  detectLayoutMode,
  parseLayoutOverride,
  readStoredLayoutOverride,
  resolveTabletPresentation,
  writeStoredLayoutOverride,
  type LayoutMode,
  type LayoutOverride,
  type TabletPresentation,
} from '../utils/layoutMode';

export interface LayoutModeContextValue extends TabletPresentation {
  override: LayoutOverride;
  setOverride: (next: LayoutOverride) => void;
  toggleLayoutMode: () => void;
}

const LayoutModeContext = createContext<LayoutModeContextValue | null>(null);

function readMediaFlag(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

function readOverrideFromUrl(): LayoutOverride {
  try {
    return parseLayoutOverride(urlService.getParam('layout'));
  } catch {
    return null;
  }
}

function replaceLayoutQueryParam(mode: LayoutOverride) {
  if (typeof window === 'undefined') return;
  try {
    const params = urlService.getSearchParams();
    if (!mode) params.delete('layout');
    else params.set('layout', mode);
    const qs = params.toString();
    const hash = window.location.hash || '';
    const qIndex = hash.indexOf('?');
    const hashPath = (qIndex >= 0 ? hash.slice(0, qIndex) : hash) || '#/';
    const nextHash = qs ? `${hashPath}?${qs}` : hashPath;
    const base = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, '', `${base}${nextHash}`);
  } catch {
    // non-fatal: localStorage still holds the override
  }
}

function readPresentation(override: LayoutOverride): TabletPresentation {
  const width = typeof window === 'undefined' ? 1440 : window.innerWidth;
  const height = typeof window === 'undefined' ? 900 : window.innerHeight;
  return resolveTabletPresentation({
    width,
    height,
    coarsePointer: readMediaFlag('(pointer: coarse)'),
    hoverNone: readMediaFlag('(hover: none)'),
    override,
  });
}

function resolveInitialOverride(): LayoutOverride {
  return readOverrideFromUrl() ?? readStoredLayoutOverride();
}

export function LayoutModeProvider({ children }: { children: ReactNode }) {
  const [override, setOverrideState] = useState<LayoutOverride>(() => resolveInitialOverride());
  const [presentation, setPresentation] = useState<TabletPresentation>(() => readPresentation(resolveInitialOverride()));

  const recompute = useCallback((nextOverride: LayoutOverride = override) => {
    setPresentation(readPresentation(nextOverride));
  }, [override]);

  const setOverride = useCallback((next: LayoutOverride) => {
    setOverrideState(next);
    writeStoredLayoutOverride(next);
    replaceLayoutQueryParam(next);
    setPresentation(readPresentation(next));
  }, []);

  const toggleLayoutMode = useCallback(() => {
    const current = detectLayoutMode({
      width: window.innerWidth,
      height: window.innerHeight,
      coarsePointer: readMediaFlag('(pointer: coarse)'),
      hoverNone: readMediaFlag('(hover: none)'),
      override,
    });
    setOverride(current === 'tablet' ? 'desktop' : 'tablet');
  }, [override, setOverride]);

  useEffect(() => {
    // URL param is the explicit request; persist it so a 12.9" user keeps desktop.
    const fromUrl = readOverrideFromUrl();
    if (fromUrl) {
      writeStoredLayoutOverride(fromUrl);
      if (fromUrl !== override) {
        setOverrideState(fromUrl);
        setPresentation(readPresentation(fromUrl));
      }
    }
  }, [override]);

  useEffect(() => {
    const onViewport = () => recompute();
    const onOrientation = () => {
      onViewport();
      // iOS often reports the old size on orientationchange; re-read after the rotation settles.
      window.setTimeout(onViewport, 100);
      window.setTimeout(onViewport, 350);
    };
    const onHash = () => {
      const fromUrl = readOverrideFromUrl();
      if (fromUrl && fromUrl !== override) {
        writeStoredLayoutOverride(fromUrl);
        setOverrideState(fromUrl);
        setPresentation(readPresentation(fromUrl));
        return;
      }
      recompute();
    };

    window.addEventListener('resize', onViewport);
    window.addEventListener('orientationchange', onOrientation);
    window.addEventListener('hashchange', onHash);
    window.visualViewport?.addEventListener('resize', onViewport);

    const media = [
      window.matchMedia('(pointer: coarse)'),
      window.matchMedia('(hover: none)'),
    ];
    const onMedia = () => recompute();
    media.forEach((mq) => {
      if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onMedia);
      else mq.addListener(onMedia);
    });

    onViewport();

    return () => {
      window.removeEventListener('resize', onViewport);
      window.removeEventListener('orientationchange', onOrientation);
      window.removeEventListener('hashchange', onHash);
      window.visualViewport?.removeEventListener('resize', onViewport);
      media.forEach((mq) => {
        if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', onMedia);
        else mq.removeListener(onMedia);
      });
    };
  }, [override, recompute]);

  const value = useMemo<LayoutModeContextValue>(() => ({
    ...presentation,
    override,
    setOverride,
    toggleLayoutMode,
  }), [presentation, override, setOverride, toggleLayoutMode]);

  return (
    <LayoutModeContext.Provider value={value}>
      {children}
    </LayoutModeContext.Provider>
  );
}

export function useLayoutMode(): LayoutModeContextValue {
  const ctx = useContext(LayoutModeContext);
  if (!ctx) {
    // Safe fallback for tests / stray mounts outside the provider.
    return {
      layoutMode: 'desktop',
      useTabs: false,
      useScaledCanvas: true,
      isPortrait: false,
      rawScale: 1,
      override: null,
      setOverride: () => undefined,
      toggleLayoutMode: () => undefined,
    };
  }
  return ctx;
}

export type { LayoutMode, LayoutOverride };
