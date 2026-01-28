/**
 * Emoji Picker Component
 *
 * Lightweight emoji picker with commonly used emojis.
 * Designed for quick selection without full keyboard.
 */

import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { shadows } from "@/design/tokens/shadows";

interface EmojiPickerProps {
  visible: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

// Common emoji categories
const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😊",
      "🥰",
      "😍",
      "🤩",
      "😘",
      "😗",
      "😚",
      "😋",
      "😜",
      "🤪",
      "😝",
      "🤗",
    ],
  },
  {
    name: "Gestures",
    emojis: [
      "👍",
      "👎",
      "👌",
      "🤝",
      "🙏",
      "👏",
      "🤞",
      "✌️",
      "🤟",
      "🤙",
      "💪",
      "👋",
      "✋",
      "🖐️",
      "👊",
      "✊",
    ],
  },
  {
    name: "Objects",
    emojis: [
      "💰",
      "💵",
      "💶",
      "💷",
      "💴",
      "📦",
      "🎁",
      "📱",
      "💻",
      "📄",
      "✈️",
      "🚗",
      "🏠",
      "⏰",
      "📍",
      "🔒",
    ],
  },
  {
    name: "Symbols",
    emojis: [
      "✅",
      "❌",
      "❓",
      "❗",
      "⭐",
      "🔥",
      "💯",
      "🎉",
      "🎊",
      "💎",
      "🏆",
      "🥇",
      "🤝",
      "🔔",
      "📌",
      "💡",
    ],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  visible,
  onSelect,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Emojis</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {EMOJI_CATEGORIES.map((category) => (
          <View key={category.name} style={styles.category}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <View style={styles.emojiGrid}>
              {category.emojis.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiButton}
                  onPress={() => onSelect(emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: 320,
    ...shadows.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  title: {
    ...typography.labelLarge,
    color: colors.text.primary,
  },
  closeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  closeText: {
    ...typography.labelMedium,
    color: colors.primary[600],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
  },
  category: {
    marginTop: spacing.md,
  },
  categoryName: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xxs,
  },
  emojiButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  emoji: {
    fontSize: 24,
  },
});
