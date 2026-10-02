import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const handleCompareFromUrl = vi.fn();
const getSearchParams = vi.fn();

vi.mock('../services/loadout/urlService', () => ({
  urlService: {
    setNavigateCallback: vi.fn(),
    setAutoUpdateEnabled: vi.fn(),
    setNavigationHandlingEnabled: vi.fn(),
    isNavigationHandlingEnabled: () => false,
    getSearchParams: () => getSearchParams(),
    handleCompareFromUrl: (...args: unknown[]) => handleCompareFromUrl(...args),
  },
}));

vi.mock('../services/loadout/loadoutService', () => ({
  loadoutService: {
    subscribeToEvents: () => () => undefined,
    subscribeToAllEvents: () => () => undefined,
    ensureSideLoadout: vi.fn(),
  },
}));

vi.mock('../constants/careerIcons', () => ({
  preloadCareerIcons: vi.fn(),
}));

vi.mock('../components/toolbar/DualToolbar', () => ({
  default: () => <div data-testid="dual-toolbar" />,
}));
vi.mock('../components/panels/DualEquipmentLayout', () => ({
  default: () => <div data-testid="dual-layout" />,
}));
vi.mock('../providers/ApolloProvider', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import App from '../App';

describe('App URL error banner', () => {
  beforeEach(() => {
    getSearchParams.mockReturnValue(new URLSearchParams('a.c=IB'));
    handleCompareFromUrl.mockReset();
  });

  it('renders errorMessage when compare URL load fails', async () => {
    handleCompareFromUrl.mockRejectedValue(new Error('bad compare link'));

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTitle(/Failed to load compare from URL: bad compare link/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Failed to load compare from URL: bad compare link/)).toBeInTheDocument();
  });
});
