/**
 * useFilters Hook
 *
 * Apply search, filter, and sorting to a dataset.
 */

import { useMemo } from 'react';

interface UseFiltersOptions<T, F> {
  items: T[];
  filters: F;
  searchQuery?: string;
  applyFilters?: (item: T, filters: F) => boolean;
  applySearch?: (item: T, query: string) => boolean;
  sortBy?: (a: T, b: T, filters: F) => number;
}

export const useFilters = <T, F>({
  items,
  filters,
  searchQuery,
  applyFilters,
  applySearch,
  sortBy,
}: UseFiltersOptions<T, F>) => {
  return useMemo(() => {
    const normalizedQuery = searchQuery?.trim().toLowerCase() || '';
    let result = items;

    if (normalizedQuery && applySearch) {
      result = result.filter((item) => applySearch(item, normalizedQuery));
    }

    if (applyFilters) {
      result = result.filter((item) => applyFilters(item, filters));
    }

    if (sortBy) {
      result = [...result].sort((a, b) => sortBy(a, b, filters));
    } else {
      result = [...result];
    }

    return result;
  }, [applyFilters, applySearch, filters, items, searchQuery, sortBy]);
};
