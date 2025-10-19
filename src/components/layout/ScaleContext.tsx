import { createContext, useContext } from 'react';

// Provides the current UI scale factor from ScaleToFit to descendants (portals retain context).
export const ScaleContext = createContext<number>(1);

export function useScale(): number {
  return useContext(ScaleContext);
}
