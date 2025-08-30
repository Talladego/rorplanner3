import { useState, useEffect, useCallback } from 'react';
import { EquipSlot, Item, Career } from '../types';
import { loadoutService } from '../services/loadoutService';

interface UseItemsForSlotResult {
  items: Item[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useItemsForSlot(slot: EquipSlot, career?: Career, limit: number = 50, levelRequirement: number = 40, renownRankRequirement: number = 80): UseItemsForSlotResult {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!career) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const connection = await loadoutService.getItemsForSlot(slot, career, limit, undefined, levelRequirement, renownRankRequirement);
      setItems(connection.nodes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [slot, career, limit, levelRequirement, renownRankRequirement]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
  };
}
