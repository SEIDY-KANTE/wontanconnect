/**
 * Chat Input Bar Component
 *
 * Enhanced input bar with:
 * - Text input with emoji support
 * - Attachment button (image/document)
 * - Typing indicator emission
 * - Read-only state handling
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";

interface ChatInputBarProps {
  onSend: (text: string) => void;
  onAttachPress: () => void;
  onEmojiPress: () => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  isReadOnly?: boolean;
  readOnlyMessage?: string;
  placeholder?: string;
  isSending?: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSend,
  onAttachPress,
  onEmojiPress,
  onTypingStart,
  onTypingStop,
  isReadOnly = false,
  readOnlyMessage = "This conversation is read-only",
  placeholder = "Type a message...",
  isSending = false,
}) => {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicator
  const handleTextChange = useCallback(
    (newText: string) => {
      setText(newText);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Start typing
      if (newText.length > 0 && onTypingStart) {
        onTypingStart();
      }

      // Stop typing after delay
      typingTimeoutRef.current = setTimeout(() => {
        if (onTypingStop) {
          onTypingStop();
        }
      }, 2000);
    },
    [onTypingStart, onTypingStop],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = useCallback(() => {
    const trimmedText = text.trim();
    if (!trimmedText || isSending) return;

    onSend(trimmedText);
    setText("");

    // Stop typing indicator
    if (onTypingStop) {
      onTypingStop();
    }
  }, [text, isSending, onSend, onTypingStop]);

  // Read-only state
  if (isReadOnly) {
    return (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={styles.readOnlyContainer}
      >
        <Ionicons name="lock-closed" size={16} color={colors.text.tertiary} />
        <Text style={styles.readOnlyText}>{readOnlyMessage}</Text>
      </Animated.View>
    );
  }

  const canSend = text.trim().length > 0 && !isSending;

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        {/* Emoji button */}
        <TouchableOpacity
          onPress={onEmojiPress}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="happy-outline"
            size={24}
            color={colors.text.tertiary}
          />
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          multiline
          maxLength={1000}
          returnKeyType="default"
          blurOnSubmit={false}
        />

        {/* Attachment button */}
        <TouchableOpacity
          onPress={onAttachPress}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Ionicons name="attach" size={24} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Send button */}
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          disabled={!canSend}
          activeOpacity={0.8}
        >
          <Ionicons
            name="send"
            size={20}
            color={canSend ? colors.neutral[0] : colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.background.secondary,
    borderRadius: radius.xl,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.text.primary,
    maxHeight: 100,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutral[200],
  },
  // Read-only state
  readOnlyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.background.tertiary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
  },
  readOnlyText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
});
