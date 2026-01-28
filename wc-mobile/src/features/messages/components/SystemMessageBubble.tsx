/**
 * System Message Bubble Component
 *
 * Renders platform-generated messages with distinct styling.
 * Used for exchange status updates and other system notifications.
 */

import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  Message,
  isSystemMessage,
  SystemContent,
  SystemMessageEvent,
} from "../model/types";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";

interface SystemMessageBubbleProps {
  message: Message;
}

/**
 * Get icon for system message event
 */
function getEventIcon(event: SystemMessageEvent): {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
} {
  const icons: Record<
    SystemMessageEvent,
    { name: keyof typeof Ionicons.glyphMap; color: string }
  > = {
    EXCHANGE_REQUEST_SENT: { name: "paper-plane", color: colors.info.main },
    EXCHANGE_ACCEPTED: { name: "checkmark-circle", color: colors.success.main },
    EXCHANGE_DECLINED: { name: "close-circle", color: colors.error.main },
    EXCHANGE_CANCELLED: { name: "ban", color: colors.error.main },
    USER_MARKED_SENT: { name: "arrow-up-circle", color: colors.info.main },
    USER_CONFIRMED_RECEIPT: {
      name: "arrow-down-circle",
      color: colors.info.main,
    },
    EXCHANGE_COMPLETED: { name: "trophy", color: colors.success.main },
    EXCHANGE_IN_TRANSIT: { name: "airplane", color: colors.info.main },
    EXCHANGE_DELIVERED: { name: "cube", color: colors.success.main },
  };
  return (
    icons[event] || { name: "information-circle", color: colors.info.main }
  );
}

export const SystemMessageBubble: React.FC<SystemMessageBubbleProps> = ({
  message,
}) => {
  if (!isSystemMessage(message)) return null;

  const content = message.content as SystemContent;
  const { name: iconName, color: iconColor } = getEventIcon(content.event);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, { borderColor: iconColor + "40" }]}>
        <Ionicons name={iconName} size={14} color={iconColor} />
        <Text style={styles.text}>{content.text}</Text>
      </View>
      <Text style={styles.time}>{formatTime(message.createdAt)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  text: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  time: {
    ...typography.captionSmall,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
  },
});
