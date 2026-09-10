export type ColorScheme = 'light' | 'dark';

export interface ColorSchemeRoot {
  classList: {
    add: (...tokens: string[]) => void;
    remove: (...tokens: string[]) => void;
  };
  style: { colorScheme: string };
}

export interface MediaQueryLike {
  matches: boolean;
  addEventListener?: (type: 'change', listener: (event: { matches: boolean }) => void) => void;
  removeEventListener?: (type: 'change', listener: (event: { matches: boolean }) => void) => void;
  addListener?: (listener: (event: { matches: boolean }) => void) => void;
  removeListener?: (listener: (event: { matches: boolean }) => void) => void;
}

/** Light media match → light scheme; anything else stays on the default dark palette. */
export function resolveColorScheme(prefersLight: boolean): ColorScheme {
  return prefersLight ? 'light' : 'dark';
}

export function applyColorScheme(root: ColorSchemeRoot, scheme: ColorScheme): void {
  if (scheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
  root.style.colorScheme = scheme;
}

export function syncColorSchemeFromPreference(
  root: ColorSchemeRoot,
  prefersLight: boolean,
): ColorScheme {
  const scheme = resolveColorScheme(prefersLight);
  applyColorScheme(root, scheme);
  return scheme;
}

export function startColorSchemeSync(
  matchMedia: ((query: string) => MediaQueryLike) | undefined = typeof window !== 'undefined' ? window.matchMedia.bind(window) : undefined,
  roots: ColorSchemeRoot[] = typeof document !== 'undefined'
    ? [document.documentElement, document.body].filter((el): el is HTMLElement => !!el)
    : [],
): () => void {
  const applyAll = (prefersLight: boolean) => {
    roots.forEach((root) => syncColorSchemeFromPreference(root, prefersLight));
  };

  if (typeof matchMedia !== 'function' || roots.length === 0) {
    applyAll(false);
    return () => undefined;
  }

  const media = matchMedia('(prefers-color-scheme: light)');
  applyAll(media.matches);

  const onChange = (event: { matches: boolean }) => applyAll(event.matches);
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }
  media.addListener?.(onChange);
  return () => media.removeListener?.(onChange);
}
