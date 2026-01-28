/**
 * Optimized Store Selectors
 *
 * Zustand selectors optimized to prevent unnecessary re-renders.
 *
 * PROBLEM: const { offers, loading, error } = useOffersStore();
 *   ↑ This causes re-renders when ANY store property changes
 *
 * SOLUTION: Use granular selectors with shallow comparison
 *   const offers = useOffers();
 *   const loading = useOffersLoading();
 *   ↑ Each component only re-renders when its specific data changes
 */

import { shallow } from "zustand/shallow";
import { useOffersStore } from "./offersStore";
import type {
  Offer,
  OffersLoadingState,
  OffersError,
  OfferType,
} from "./offersStore";

// ============================================================================
// PRIMITIVE SELECTORS (No re-render issues)
// ============================================================================

/**
 * Get loading state only
 * Re-renders only when loading state changes
 */
export const useOffersLoading = (): OffersLoadingState =>
  useOffersStore((state) => state.loadingState);

/**
 * Get error state only
 * Re-renders only when error changes
 */
export const useOffersError = (): OffersError | null =>
  useOffersStore((state) => state.error);

/**
 * Check if currently loading
 */
export const useIsOffersLoading = (): boolean =>
  useOffersStore((state) => state.loadingState !== "idle");

// ============================================================================
// ARRAY SELECTORS (Use shallow comparison)
// ============================================================================

/**
 * Get FX offers with shallow comparison
 * Only re-renders when the offers array actually changes
 */
export const useFxOffers = (): Offer[] =>
  useOffersStore((state) => state.fxOffers, shallow);

/**
 * Get Shipping offers with shallow comparison
 */
export const useShippingOffers = (): Offer[] =>
  useOffersStore((state) => state.shippingOffers, shallow);

/**
 * Get user's own offers with shallow comparison
 */
export const useMyOffers = (): Offer[] =>
  useOffersStore((state) => state.myOffers, shallow);

// ============================================================================
// COMPUTED/DERIVED SELECTORS
// ============================================================================

/**
 * Get current offer being viewed
 */
export const useCurrentOffer = (): Offer | null =>
  useOffersStore((state) => state.currentOffer);

/**
 * Get offers count by type
 */
export const useFxOffersCount = (): number =>
  useOffersStore((state) => state.fxOffers.length);

export const useShippingOffersCount = (): number =>
  useOffersStore((state) => state.shippingOffers.length);

/**
 * Get an offer by ID (memoized selector)
 */
export const useOfferById = (id: string, type: OfferType): Offer | undefined =>
  useOffersStore((state) => state.getOfferById(id, type));

// ============================================================================
// PAGINATION SELECTORS
// ============================================================================

interface PaginationState {
  page: number;
  total: number;
  totalPages: number;
}

/**
 * Get FX pagination with shallow comparison
 */
export const useFxPagination = (): PaginationState =>
  useOffersStore((state) => state.fxPagination, shallow);

/**
 * Get Shipping pagination with shallow comparison
 */
export const useShippingPagination = (): PaginationState =>
  useOffersStore((state) => state.shippingPagination, shallow);

/**
 * Check if there are more offers to load
 */
export const useHasMoreFxOffers = (): boolean =>
  useOffersStore(
    (state) => state.fxPagination.page < state.fxPagination.totalPages,
  );

export const useHasMoreShippingOffers = (): boolean =>
  useOffersStore(
    (state) =>
      state.shippingPagination.page < state.shippingPagination.totalPages,
  );

// ============================================================================
// COMBINED SELECTORS (Multiple values with shallow)
// ============================================================================

interface OffersListState {
  offers: Offer[];
  loading: boolean;
  hasMore: boolean;
}

/**
 * Get FX offers list state (offers, loading, hasMore)
 */
export const useFxOffersListState = (): OffersListState =>
  useOffersStore(
    (state) => ({
      offers: state.fxOffers,
      loading: state.loadingState === "loading_list",
      hasMore: state.fxPagination.page < state.fxPagination.totalPages,
    }),
    shallow,
  );

/**
 * Get Shipping offers list state
 */
export const useShippingOffersListState = (): OffersListState =>
  useOffersStore(
    (state) => ({
      offers: state.shippingOffers,
      loading: state.loadingState === "loading_list",
      hasMore:
        state.shippingPagination.page < state.shippingPagination.totalPages,
    }),
    shallow,
  );

// ============================================================================
// ACTION SELECTORS (Functions don't cause re-renders)
// ============================================================================

/**
 * Get offers actions (stable references)
 */
export const useOffersActions = () =>
  useOffersStore(
    (state) => ({
      loadFxOffers: state.loadFxOffers,
      loadShippingOffers: state.loadShippingOffers,
      loadMyOffers: state.loadMyOffers,
      loadOfferDetail: state.loadOfferDetail,
      refreshOffers: state.refreshOffers,
      createOffer: state.createOffer,
      updateOffer: state.updateOffer,
      deleteOffer: state.deleteOffer,
      clearError: state.clearError,
      clearCurrentOffer: state.clearCurrentOffer,
    }),
    shallow,
  );

// ============================================================================
// OPTIMIZED HOOKS PATTERN
// ============================================================================

/**
 * Complete offers hook with optimized selectors
 * Returns only what's needed, prevents over-subscription
 */
export function useOptimizedOffers(type: OfferType) {
  const offers = type === "fx" ? useFxOffers() : useShippingOffers();
  const pagination =
    type === "fx" ? useFxPagination() : useShippingPagination();
  const loading = useOffersLoading();
  const error = useOffersError();
  const { loadFxOffers, loadShippingOffers, refreshOffers, clearError } =
    useOffersActions();

  return {
    offers,
    pagination,
    loading: loading === "loading_list",
    error,
    loadOffers: type === "fx" ? loadFxOffers : loadShippingOffers,
    refresh: () => refreshOffers(type),
    clearError,
  };
}

// ============================================================================
// USAGE EXAMPLES (in comments)
// ============================================================================

/*
// ❌ BAD: Causes re-renders when ANY store property changes
function OffersScreen() {
  const { fxOffers, shippingOffers, loadingState, error, fxPagination } = useOffersStore();
  // Re-renders when myOffers changes, even though we don't use it!
}

// ✅ GOOD: Only re-renders when used values change
function OffersScreen() {
  const offers = useFxOffers();
  const loading = useIsOffersLoading();
  const pagination = useFxPagination();
  // Only re-renders when fxOffers, loading, or fxPagination change
}

// ✅ EVEN BETTER: Combined selector with shallow comparison
function OffersScreen() {
  const { offers, loading, hasMore } = useFxOffersListState();
  const { loadFxOffers, refreshOffers } = useOffersActions();
  // Single subscription, but granular updates
}
*/
