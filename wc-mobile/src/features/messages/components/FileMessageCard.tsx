/**
 * File Message Card Component
 *
 * Renders image and document message attachments.
 */

import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  Message,
  isImageMessage,
  isDocumentMessage,
  ImageContent,
  DocumentContent,
  formatFileSize,
  getFileIcon,
} from "../model/types";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { shadows } from "@/design/tokens/shadows";

interface FileMessageCardProps {
  message: Message;
  isMe: boolean;
}

export const FileMessageCard: React.FC<FileMessageCardProps> = ({
  message,
  isMe,
}) => {
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);

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
          <Ionicons
            name="time-outline"
            size={12}
            color={isMe ? colors.primary[300] : colors.text.tertiary}
          />
        );
      case "SENT":
        return (
          <Ionicons
            name="checkmark"
            size={12}
            color={isMe ? colors.primary[300] : colors.text.tertiary}
          />
        );
      case "DELIVERED":
        return (
          <Ionicons
            name="checkmark-done"
            size={12}
            color={isMe ? colors.primary[300] : colors.text.tertiary}
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
      default:
        return null;
    }
  };

  // Image message
  if (isImageMessage(message)) {
    const content = message.content as ImageContent;

    return (
      <>
        <TouchableOpacity
          style={[styles.imageContainer, isMe && styles.imageContainerMe]}
          onPress={() => setImagePreviewVisible(true)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: content.thumbnailUri || content.uri }}
            style={styles.image}
            resizeMode="cover"
          />
          {content.caption && (
            <View
              style={[
                styles.captionContainer,
                isMe && styles.captionContainerMe,
              ]}
            >
              <Text style={[styles.caption, isMe && styles.captionMe]}>
                {content.caption}
              </Text>
            </View>
          )}
          <View style={styles.imageFooter}>
            <Text style={styles.imageTime}>
              {formatTime(message.createdAt)}
            </Text>
            {renderStatusIcon()}
          </View>
        </TouchableOpacity>

        {/* Image Preview Modal */}
        <Modal
          visible={imagePreviewVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setImagePreviewVisible(false)}
        >
          <Pressable
            style={styles.previewOverlay}
            onPress={() => setImagePreviewVisible(false)}
          >
            <Image
              source={{ uri: content.uri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.previewClose}
              onPress={() => setImagePreviewVisible(false)}
            >
              <Ionicons name="close" size={28} color={colors.neutral[0]} />
            </TouchableOpacity>
          </Pressable>
        </Modal>
      </>
    );
  }

  // Document message
  if (isDocumentMessage(message)) {
    const content = message.content as DocumentContent;
    const iconName = getFileIcon(
      content.mimeType,
    ) as keyof typeof Ionicons.glyphMap;

    return (
      <TouchableOpacity
        style={[
          styles.documentContainer,
          isMe ? styles.documentContainerMe : styles.documentContainerOther,
        ]}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.documentIcon,
            isMe ? styles.documentIconMe : styles.documentIconOther,
          ]}
        >
          <Ionicons
            name={iconName}
            size={24}
            color={isMe ? colors.neutral[0] : colors.primary[600]}
          />
        </View>
        <View style={styles.documentInfo}>
          <Text
            style={[styles.documentName, isMe && styles.documentNameMe]}
            numberOfLines={1}
          >
            {content.fileName}
          </Text>
          <Text style={[styles.documentSize, isMe && styles.documentSizeMe]}>
            {formatFileSize(content.fileSize)}
          </Text>
        </View>
        <View style={styles.documentFooter}>
          <Text style={[styles.documentTime, isMe && styles.documentTimeMe]}>
            {formatTime(message.createdAt)}
          </Text>
          {renderStatusIcon()}
        </View>
      </TouchableOpacity>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  // Image styles
  imageContainer: {
    borderRadius: radius.lg,
    overflow: "hidden",
    maxWidth: 250,
    backgroundColor: colors.background.primary,
    ...shadows.sm,
  },
  imageContainerMe: {
    backgroundColor: colors.primary[600],
  },
  image: {
    width: 250,
    height: 180,
  },
  captionContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.primary,
  },
  captionContainerMe: {
    backgroundColor: colors.primary[600],
  },
  caption: {
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  captionMe: {
    color: colors.neutral[0],
  },
  imageFooter: {
    position: "absolute",
    bottom: spacing.xs,
    right: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  imageTime: {
    ...typography.captionSmall,
    color: colors.neutral[0],
  },

  // Preview modal
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "80%",
  },
  previewClose: {
    position: "absolute",
    top: 50,
    right: 20,
    padding: spacing.sm,
  },

  // Document styles
  documentContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.sm,
    maxWidth: 280,
  },
  documentContainerOther: {
    backgroundColor: colors.background.primary,
    ...shadows.sm,
  },
  documentContainerMe: {
    backgroundColor: colors.primary[600],
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  documentIconOther: {
    backgroundColor: colors.primary[100],
  },
  documentIconMe: {
    backgroundColor: colors.primary[500],
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    ...typography.labelMedium,
    color: colors.text.primary,
  },
  documentNameMe: {
    color: colors.neutral[0],
  },
  documentSize: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  documentSizeMe: {
    color: colors.primary[200],
  },
  documentFooter: {
    alignItems: "flex-end",
    gap: spacing.xxs,
  },
  documentTime: {
    ...typography.captionSmall,
    color: colors.text.tertiary,
  },
  documentTimeMe: {
    color: colors.primary[200],
  },
});
