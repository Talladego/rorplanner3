import {
  applyColorScheme,
  resolveColorScheme,
  startColorSchemeSync,
  syncColorSchemeFromPreference,
  type ColorSchemeRoot,
  type MediaQueryLike,
} from '../utils/colorScheme';

function makeRoot(): ColorSchemeRoot & { classes: Set<string> } {
  const classes = new Set<string>();
  return {
    classes,
    classList: {
      add: (...tokens: string[]) => tokens.forEach((t) => classes.add(t)),
      remove: (...tokens: string[]) => tokens.forEach((t) => classes.delete(t)),
    },
    style: { colorScheme: '' },
  };
}

describe('resolveColorScheme', () => {
  it('maps prefers-light to light and otherwise dark', () => {
    expect(resolveColorScheme(true)).toBe('light');
    expect(resolveColorScheme(false)).toBe('dark');
  });
});

describe('applyColorScheme', () => {
  it('toggles dark/light classes and color-scheme', () => {
    const root = makeRoot();
    applyColorScheme(root, 'dark');
    expect(root.classes.has('dark')).toBe(true);
    expect(root.classes.has('light')).toBe(false);
    expect(root.style.colorScheme).toBe('dark');

    applyColorScheme(root, 'light');
    expect(root.classes.has('dark')).toBe(false);
    expect(root.classes.has('light')).toBe(true);
    expect(root.style.colorScheme).toBe('light');
  });
});

describe('syncColorSchemeFromPreference', () => {
  it('applies light when the media query matches', () => {
    const root = makeRoot();
    expect(syncColorSchemeFromPreference(root, true)).toBe('light');
    expect(root.classes.has('light')).toBe(true);
    expect(root.style.colorScheme).toBe('light');
  });
});

describe('startColorSchemeSync', () => {
  it('applies the current preference and updates on change', () => {
    const root = makeRoot();
    let listener: ((event: { matches: boolean }) => void) | undefined;
    const media: MediaQueryLike = {
      matches: false,
      addEventListener: (_type, next) => { listener = next; },
      removeEventListener: () => { listener = undefined; },
    };

    const stop = startColorSchemeSync(() => media, [root]);
    expect(root.classes.has('dark')).toBe(true);
    expect(root.style.colorScheme).toBe('dark');

    listener?.({ matches: true });
    expect(root.classes.has('light')).toBe(true);
    expect(root.style.colorScheme).toBe('light');

    stop();
    expect(listener).toBeUndefined();
  });

  it('defaults to dark when matchMedia is unavailable', () => {
    const root = makeRoot();
    const stop = startColorSchemeSync(undefined, [root]);
    expect(root.classes.has('dark')).toBe(true);
    expect(root.style.colorScheme).toBe('dark');
    stop();
  });
});
