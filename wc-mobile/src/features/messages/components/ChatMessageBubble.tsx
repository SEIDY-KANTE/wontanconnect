/**
 * Chat Message Bubble Component
 *
 * Renders text messages with proper styling for sender/receiver.
 * Supports message status indicators (sent, delivered, seen).
 */

import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Message, isTextMessage, TextContent } from "../model/types";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { shadows } from "@/design/tokens/shadows";

interface ChatMessageBubbleProps {
  message: Message;
  isMe: boolean;
  showTime?: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  isMe,
  showTime = true,
}) => {
  const content = isTextMessage(message)
    ? (message.content as TextContent).text
    : "";

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStatusIcon = () => {
    if (!isMe) return null;

    switch (message.status) {
      case "SENDING":
        return (
          <Ionicons name="time-outline" size={12} color={colors.primary[300]} />
        );
      case "SENT":
        return (
          <Ionicons name="checkmark" size={12} color={colors.primary[300]} />
        );
      case "DELIVERED":
        return (
          <Ionicons
            name="checkmark-done"
            size={12}
            color={colors.primary[300]}
          />
        );
      case "SEEN":
        return (
          <Ionicons
            name="checkmark-done"
            size={12}
            color={colors.success.main}
          />
        );
      case "FAILED":
        return (
          <Ionicons name="alert-circle" size={12} color={colors.error.main} />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
      <Text style={[styles.text, isMe && styles.textMe]}>{content}</Text>
      {showTime && (
        <View style={styles.footer}>
          <Text style={[styles.time, isMe && styles.timeMe]}>
            {formatTime(message.createdAt)}
          </Text>
          {renderStatusIcon()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    maxWidth: "100%",
  },
  bubbleOther: {
    backgroundColor: colors.background.primary,
    borderBottomLeftRadius: radius.xs,
    ...shadows.sm,
  },
  bubbleMe: {
    backgroundColor: colors.primary[600],
    borderBottomRightRadius: radius.xs,
  },
  text: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  textMe: {
    color: colors.neutral[0],
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: spacing.xxs,
    gap: spacing.xxs,
  },
  time: {
    ...typography.captionSmall,
    color: colors.text.tertiary,
  },
  timeMe: {
    color: colors.primary[200],
  },
});
