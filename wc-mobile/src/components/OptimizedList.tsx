/**
 * Optimized List Component
 *
 * Production-ready FlatList wrapper optimized for:
 * - 1000+ items at 60fps
 * - Proper virtualization
 * - Pull-to-refresh
 * - Infinite scroll with pagination
 * - Loading and empty states
 * - Error handling with retry
 */

import React, { useCallback, useMemo, memo, useState } from "react";
import {
  FlatList,
  FlatListProps,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  ListRenderItem,
  ViewStyle,
  LayoutChangeEvent,
} from "react-native";
import { MobilePaginationMeta } from "@/api/contracts/pagination";

// ============================================================================
// TYPES
// ============================================================================

interface OptimizedListProps<T> extends Omit<
  FlatListProps<T>,
  "renderItem" | "data"
> {
  // Data
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: ListRenderItem<T>;

  // Pagination
  pagination?: MobilePaginationMeta;
  onLoadMore?: () => void | Promise<void>;
  isLoadingMore?: boolean;

  // Refresh
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;

  // Loading state
  isLoading?: boolean;
  loadingComponent?: React.ReactNode;

  // Empty state
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: string;
  emptyComponent?: React.ReactNode;

  // Error state
  error?: { message: string } | null;
  onRetry?: () => void;
  errorComponent?: React.ReactNode;

  // Sizing (required for optimal virtualization)
  estimatedItemHeight: number;

  // Styling
  contentContainerStyle?: ViewStyle;
  listHeaderComponent?: React.ReactNode;
}

// ============================================================================
// DEFAULT COMPONENTS
// ============================================================================

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
}

const DefaultEmptyState = memo(
  ({
    title = "No items",
    message = "There are no items to display.",
    icon = "📭",
  }: EmptyStateProps) => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  ),
);

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

const DefaultErrorState = memo(({ message, onRetry }: ErrorStateProps) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorIcon}>⚠️</Text>
    <Text style={styles.errorTitle}>Something went wrong</Text>
    <Text style={styles.errorMessage}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Tap to Retry</Text>
      </TouchableOpacity>
    )}
  </View>
));

const DefaultLoadingState = memo(() => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3B82F6" />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
));

const ListFooterLoading = memo(() => (
  <View style={styles.footerContainer}>
    <ActivityIndicator size="small" color="#3B82F6" />
    <Text style={styles.footerText}>Loading more...</Text>
  </View>
));

const ListFooterEnd = memo(() => (
  <View style={styles.footerContainer}>
    <Text style={styles.footerEndText}>You've reached the end</Text>
  </View>
));

// ============================================================================
// OPTIMIZED LIST COMPONENT
// ============================================================================

function OptimizedListInner<T>(
  props: OptimizedListProps<T>,
  ref: React.ForwardedRef<FlatList<T>>,
) {
  const {
    data,
    keyExtractor,
    renderItem,
    // Pagination
    pagination,
    onLoadMore,
    isLoadingMore = false,
    // Refresh
    onRefresh,
    isRefreshing = false,
    // Loading
    isLoading = false,
    loadingComponent,
    // Empty
    emptyTitle,
    emptyMessage,
    emptyIcon,
    emptyComponent,
    // Error
    error,
    onRetry,
    errorComponent,
    // Sizing
    estimatedItemHeight,
    // Styling
    contentContainerStyle,
    listHeaderComponent,
    // Rest
    ...flatListProps
  } = props;

  const [listHeight, setListHeight] = useState(0);

  // -------------------------------------------------------------------------
  // LAYOUT CALCULATION
  // -------------------------------------------------------------------------

  /**
   * Calculate optimal window size based on list height
   * windowSize = number of visible items + buffer
   */
  const windowSize = useMemo(() => {
    if (!listHeight || !estimatedItemHeight) return 5;
    const visibleItems = Math.ceil(listHeight / estimatedItemHeight);
    return Math.max(5, Math.ceil(visibleItems * 1.5));
  }, [listHeight, estimatedItemHeight]);

  /**
   * getItemLayout for optimal scrolling performance
   * Required for large lists with uniform item heights
   */
  const getItemLayout = useCallback(
    (_data: T[] | null | undefined, index: number) => ({
      length: estimatedItemHeight,
      offset: estimatedItemHeight * index,
      index,
    }),
    [estimatedItemHeight],
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setListHeight(event.nativeEvent.layout.height);
  }, []);

  // -------------------------------------------------------------------------
  // INFINITE SCROLL
  // -------------------------------------------------------------------------

  const hasMore = pagination ? pagination.hasNext : false;

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  // -------------------------------------------------------------------------
  // FOOTER COMPONENT
  // -------------------------------------------------------------------------

  const ListFooterComponent = useMemo(() => {
    if (isLoadingMore) {
      return <ListFooterLoading />;
    }
    if (data.length > 0 && !hasMore) {
      return <ListFooterEnd />;
    }
    return null;
  }, [isLoadingMore, data.length, hasMore]);

  // -------------------------------------------------------------------------
  // EMPTY COMPONENT
  // -------------------------------------------------------------------------

  const ListEmptyComponent = useMemo(() => {
    if (isLoading) return null;

    if (error) {
      return (
        errorComponent || (
          <DefaultErrorState message={error.message} onRetry={onRetry} />
        )
      );
    }

    return (
      emptyComponent || (
        <DefaultEmptyState
          title={emptyTitle}
          message={emptyMessage}
          icon={emptyIcon}
        />
      )
    );
  }, [
    isLoading,
    error,
    onRetry,
    errorComponent,
    emptyComponent,
    emptyTitle,
    emptyMessage,
    emptyIcon,
  ]);

  // -------------------------------------------------------------------------
  // REFRESH CONTROL
  // -------------------------------------------------------------------------

  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;

    return (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        colors={["#3B82F6"]}
        tintColor="#3B82F6"
        title="Pull to refresh"
        titleColor="#6B7280"
      />
    );
  }, [onRefresh, isRefreshing]);

  // -------------------------------------------------------------------------
  // LOADING STATE
  // -------------------------------------------------------------------------

  if (isLoading && data.length === 0) {
    return loadingComponent || <DefaultLoadingState />;
  }

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  return (
    <FlatList
      ref={ref}
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onLayout={handleLayout}
      // Performance optimizations
      getItemLayout={getItemLayout}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={windowSize}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={50}
      // Pull to refresh
      refreshControl={refreshControl}
      // Infinite scroll
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      // Components
      ListHeaderComponent={listHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      // Styling
      contentContainerStyle={[
        styles.contentContainer,
        data.length === 0 && styles.emptyContentContainer,
        contentContainerStyle,
      ]}
      // Accessibility
      accessibilityRole="list"
      // Rest
      {...flatListProps}
    />
  );
}

// Forward ref with generics
export const OptimizedList = React.forwardRef(OptimizedListInner) as <T>(
  props: OptimizedListProps<T> & { ref?: React.ForwardedRef<FlatList<T>> },
) => ReturnType<typeof OptimizedListInner>;

// ============================================================================
// MEMOIZED ITEM WRAPPER
// ============================================================================

/**
 * HOC to memoize list items and prevent unnecessary re-renders
 *
 * Usage:
 * const MemoizedOfferCard = createMemoizedItem<Offer>(OfferCard);
 */
export function createMemoizedItem<T extends { id: string }>(
  Component: React.ComponentType<{ item: T; index: number }>,
): React.MemoExoticComponent<React.ComponentType<{ item: T; index: number }>> {
  return memo(Component, (prevProps, nextProps) => {
    // Only re-render if item ID changes (shallow comparison)
    return prevProps.item.id === nextProps.item.id;
  });
}

/**
 * Wrapper for renderItem to ensure memoization
 */
export function useMemoizedRenderItem<T>(
  renderFn: (item: T, index: number) => React.ReactElement,
): ListRenderItem<T> {
  return useCallback(({ item, index }) => renderFn(item, index), [renderFn]);
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: "center",
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },

  // Error state
  errorContainer: {
    alignItems: "center",
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Footer
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#6B7280",
  },
  footerEndText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export default OptimizedList;
export { DefaultEmptyState, DefaultErrorState, DefaultLoadingState };
