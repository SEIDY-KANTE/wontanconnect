/**
 * Attachment Picker Sheet Component
 *
 * Bottom sheet for selecting image or document attachments.
 */

import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { BottomSheet } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";

interface AttachmentPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectImage: () => void;
  onSelectDocument: () => void;
}

export const AttachmentPickerSheet: React.FC<AttachmentPickerSheetProps> = ({
  visible,
  onClose,
  onSelectImage,
  onSelectDocument,
}) => {
  const options = [
    {
      id: "image",
      icon: "image" as const,
      label: "Photo",
      sublabel: "Send a photo from gallery",
      color: colors.success.main,
      bgColor: colors.success.light,
      onPress: onSelectImage,
    },
    {
      id: "document",
      icon: "document" as const,
      label: "Document",
      sublabel: "Send a file or PDF",
      color: colors.info.main,
      bgColor: colors.info.light,
      onPress: onSelectDocument,
    },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Send attachment">
      <View style={styles.content}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.option}
            onPress={() => {
              option.onPress();
              onClose();
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: option.bgColor },
              ]}
            >
              <Ionicons name={option.icon} size={24} color={option.color} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionSublabel}>{option.sublabel}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    ...typography.labelLarge,
    color: colors.text.primary,
  },
  optionSublabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
});
