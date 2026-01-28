/**
 * Inbox Screen
 */

import React, { useState, useCallback, useEffect } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInRight } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { MessagesScreenProps } from "@/core/navigation/types";
import { useMessagesStore } from "../store/messagesStore";
import { Conversation } from "../model/types";
import { Avatar, EmptyState, SearchBar, Button } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { gradients } from "@/design/tokens/gradients";
import { shadows } from "@/design/tokens/shadows";
import { useIsGuest } from "@/core/store/authStore";
import { useAuthStore } from "@/core/store/authStore";

export const InboxScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<MessagesScreenProps<"Inbox">["navigation"]>();
  const insets = useSafeAreaInsets();
  const isGuest = useIsGuest();
  const logout = useAuthStore((state) => state.logout);

  const { conversations, loadConversations } = useMessagesStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, [loadConversations]);

  const handleConversationPress = (conversation: Conversation) => {
    const otherParticipant = conversation.participants.find(
      (p) => p.id !== "current-user",
    );
    navigation.navigate("Chat", {
      conversationId: conversation.id,
      recipientName: otherParticipant?.name || "Chat",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return t("messages.yesterday");
    } else if (diffDays < 7) {
      return date.toLocaleDateString("fr-FR", { weekday: "short" });
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const otherParticipant = conv.participants.find(
      (p) => p.id !== "current-user",
    );
    return otherParticipant?.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  const renderConversation = ({
    item,
    index,
  }: {
    item: Conversation;
    index: number;
  }) => {
    const otherParticipant = item.participants.find(
      (p) => p.id !== "current-user",
    );
    const hasUnread = item.unreadCount > 0;

    return (
      <Animated.View entering={FadeInRight.delay(index * 50)}>
        <TouchableOpacity
          style={styles.conversationItem}
          onPress={() => handleConversationPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <Avatar
              source={otherParticipant?.avatar}
              name={otherParticipant?.name}
              size="lg"
            />
            {otherParticipant?.isOnline && (
              <View style={styles.onlineIndicator} />
            )}
          </View>

          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text
                style={[styles.participantName, hasUnread && styles.unreadText]}
                numberOfLines={1}
              >
                {otherParticipant?.name}
              </Text>
              <Text
                style={[styles.timestamp, hasUnread && styles.unreadTimestamp]}
              >
                {item.lastMessage ? formatTime(item.lastMessage.createdAt) : ""}
              </Text>
            </View>

            <View style={styles.conversationPreview}>
              <Text
                style={[styles.lastMessage, hasUnread && styles.unreadText]}
                numberOfLines={2}
              >
                {item.lastMessage?.senderId === "current-user" ? "Vous: " : ""}
                {"text" in (item.lastMessage?.content || {})
                  ? (item.lastMessage?.content as { text: string }).text
                  : ""}
              </Text>
              {hasUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={gradients.brandSoft}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <Text style={styles.title}>{t("messages.title")}</Text>
        {!isGuest && (
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("common.search")}
          />
        )}
      </LinearGradient>

      {/* Guest Restriction */}
      {isGuest ? (
        <View style={styles.guestContainer}>
          <View style={styles.guestIconContainer}>
            <Ionicons
              name="lock-closed"
              size={64}
              color={colors.primary[500]}
            />
          </View>
          <Text style={styles.guestTitle}>{t("guest.messagesRestricted")}</Text>
          <Text style={styles.guestMessage}>
            {t("guest.messagesDescription")}
          </Text>
          <Button
            label={t("guest.createAccount")}
            onPress={logout}
            variant="primary"
            style={styles.guestButton}
          />
        </View>
      ) : filteredConversations.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title={t("messages.emptyTitle")}
          message={t("messages.emptyMessage")}
        />
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderConversation}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary[500]}
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
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    ...shadows.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.base,
    marginTop: spacing.sm,
  },
  guestContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  guestIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  guestTitle: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  guestMessage: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  guestButton: {
    minWidth: 200,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  conversationItem: {
    flexDirection: "row",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.primary,
  },
  avatarContainer: {
    position: "relative",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success.main,
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  conversationContent: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: "center",
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xxs,
  },
  participantName: {
    ...typography.labelLarge,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  timestamp: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  unreadTimestamp: {
    color: colors.primary[600],
  },
  conversationPreview: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastMessage: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  unreadText: {
    fontWeight: "600",
    color: colors.text.primary,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  unreadCount: {
    ...typography.captionSmall,
    color: colors.neutral[0],
    fontWeight: "600",
  },
});
