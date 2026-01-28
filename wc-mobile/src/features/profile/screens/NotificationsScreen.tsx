/**
 * Notifications Screen
 *
 * Shows user notifications for exchange activities.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ProfileScreenProps } from "@/core/navigation/types";
import { EmptyState, Header, SkeletonCard } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import {
  listNotifications as apiListNotifications,
  markNotificationRead as apiMarkNotificationRead,
  markAllNotificationsRead as apiMarkAllNotificationsRead,
  USE_API,
} from "@/api";

interface Notification {
  id: string;
  type:
    | "exchange_accepted"
    | "exchange_completed"
    | "exchange_request"
    | "exchange_cancelled";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  exchangeId?: string;
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    type: "exchange_accepted",
    title: "notifications.types.exchangeAccepted",
    message: "notifications.messages.exchangeAccepted",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    isRead: false,
    exchangeId: "ex-1",
  },
  {
    id: "notif-2",
    type: "exchange_completed",
    title: "notifications.types.exchangeCompleted",
    message: "notifications.messages.exchangeCompleted",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    isRead: false,
    exchangeId: "ex-2",
  },
  {
    id: "notif-3",
    type: "exchange_request",
    title: "notifications.types.newRequest",
    message: "notifications.messages.newRequest",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    isRead: true,
    exchangeId: "ex-3",
  },
];

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "exchange_accepted":
      return { name: "checkmark-circle" as const, color: colors.success.main };
    case "exchange_completed":
      return { name: "trophy" as const, color: colors.secondary[500] };
    case "exchange_request":
      return { name: "notifications" as const, color: colors.primary[500] };
    case "exchange_cancelled":
      return { name: "close-circle" as const, color: colors.error.main };
    default:
      return {
        name: "notifications-outline" as const,
        color: colors.text.secondary,
      };
  }
};

const formatRelativeTime = (timestamp: string, t: (key: string) => string) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return t("notifications.time.minutesAgo").replace(
      "{{count}}",
      String(diffMins),
    );
  } else if (diffHours < 24) {
    return t("notifications.time.hoursAgo").replace(
      "{{count}}",
      String(diffHours),
    );
  } else {
    return t("notifications.time.daysAgo").replace(
      "{{count}}",
      String(diffDays),
    );
  }
};

export const NotificationsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<ProfileScreenProps<"Notifications">["navigation"]>();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      if (!USE_API) {
        // Mock mode
        setNotifications(mockNotifications);
        setIsLoading(false);
        return;
      }

      // API mode
      console.log("[NotificationsScreen] Loading notifications...");
      const { notifications: apiNotifications } = await apiListNotifications();

      // Map API notifications to local format
      const mapped: Notification[] = apiNotifications.map((n: any) => ({
        id: n.id,
        type: n.type || "exchange_request",
        title: `notifications.types.${n.type || "newRequest"}`,
        message: n.message || n.body || "",
        timestamp: n.createdAt,
        isRead: !!n.readAt,
        exchangeId: n.metadata?.sessionId || n.metadata?.exchangeId,
      }));

      setNotifications(mapped);
      console.log(
        "[NotificationsScreen] Loaded",
        mapped.length,
        "notifications",
      );
    } catch (error) {
      console.error(
        "[NotificationsScreen] Failed to load notifications:",
        error,
      );
      // Fallback to mock
      setNotifications(mockNotifications);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read locally
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
    );

    // Mark as read on API
    if (USE_API) {
      try {
        await apiMarkNotificationRead(notification.id);
      } catch (error) {
        console.error("[NotificationsScreen] Failed to mark as read:", error);
      }
    }

    // Navigate to exchange detail if available
    if (notification.exchangeId) {
      navigation.navigate("ExchangeDetail", {
        exchangeId: notification.exchangeId,
      });
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    if (USE_API) {
      try {
        await apiMarkAllNotificationsRead();
      } catch (error) {
        console.error(
          "[NotificationsScreen] Failed to mark all as read:",
          error,
        );
      }
    }
  };

  const renderNotification = ({
    item,
    index,
  }: {
    item: Notification;
    index: number;
  }) => {
    const icon = getNotificationIcon(item.type);

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <TouchableOpacity
          style={[
            styles.notificationItem,
            !item.isRead && styles.notificationUnread,
          ]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${icon.color}15` },
            ]}
          >
            <Ionicons name={icon.name} size={24} color={icon.color} />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{t(item.title)}</Text>
            <Text style={styles.notificationMessage}>{t(item.message)}</Text>
            <Text style={styles.notificationTime}>
              {formatRelativeTime(item.timestamp, t)}
            </Text>
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderRightAction = () => {
    if (unreadCount === 0) return null;
    return (
      <TouchableOpacity
        onPress={handleMarkAllRead}
        style={styles.markAllButton}
      >
        <Text style={styles.markAllText}>{t("notifications.markAllRead")}</Text>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header
          title={t("notifications.title")}
          showBack
          onBack={() => navigation.goBack()}
          variant="gradient"
          elevated
        />
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} style={{ marginBottom: spacing.sm }} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={t("notifications.title")}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={renderRightAction()}
        variant="gradient"
        elevated
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title={t("notifications.emptyTitle")}
          message={t("notifications.emptyMessage")}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary[600]]}
              tintColor={colors.primary[600]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  listContent: {
    padding: spacing.base,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  notificationUnread: {
    backgroundColor: colors.primary[50],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...typography.labelMedium,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  notificationMessage: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  notificationTime: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[500],
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  separator: {
    height: spacing.sm,
  },
  markAllButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  markAllText: {
    ...typography.labelSmall,
    color: colors.primary[600],
  },
});
