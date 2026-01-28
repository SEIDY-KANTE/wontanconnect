/**
 * Rating Modal
 *
 * Modal for rating an exchange after completion.
 */

import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";

import { BottomSheet, Button, Avatar } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { User } from "@/features/fx/model/types";

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  partner: User;
  onSubmit: (rating: number, comment?: string) => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  partner,
  onSubmit,
}) => {
  const { t } = useTranslation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarPress = (star: number) => {
    setRating(star);
  };

  const handleSubmit = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    onSubmit(rating, comment.trim() || undefined);
    setIsSubmitting(false);

    // Reset state
    setRating(0);
    setComment("");
    onClose();
  };

  const handleClose = () => {
    setRating(0);
    setComment("");
    onClose();
  };

  const getRatingLabel = (star: number): string => {
    switch (star) {
      case 1:
        return "😔";
      case 2:
        return "😕";
      case 3:
        return "😐";
      case 4:
        return "😊";
      case 5:
        return "🤩";
      default:
        return "";
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title={t("exchange.rating.title")}
      subtitle={t("exchange.rating.subtitle")}
      dismissOnBackdrop={false}
    >
      {/* Partner Info */}
      <View style={styles.partnerRow}>
        <Avatar
          source={partner.avatar}
          name={partner.name}
          size="lg"
          verified={partner.isVerified}
        />
        <View style={styles.partnerInfo}>
          <Text style={styles.partnerName}>{partner.name}</Text>
          {partner.rating !== undefined && partner.rating > 0 && (
            <View style={styles.existingRatingRow}>
              <Ionicons name="star" size={14} color={colors.secondary[500]} />
              <Text style={styles.existingRatingText}>
                {partner.rating} ({partner.totalDeals || 0}{" "}
                {t("profile.stats.deals").toLowerCase()})
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Star Rating */}
      <View style={styles.starsContainer}>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => handleStarPress(star)}
              activeOpacity={0.7}
              style={styles.starButton}
            >
              <Animated.View>
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={40}
                  color={
                    star <= rating ? colors.secondary[500] : colors.neutral[300]
                  }
                />
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>
        {rating > 0 && (
          <Animated.View entering={FadeIn} style={styles.ratingEmoji}>
            <Text style={styles.emojiText}>{getRatingLabel(rating)}</Text>
          </Animated.View>
        )}
      </View>

      {/* Comment Input */}
      <View style={styles.commentContainer}>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder={t("exchange.rating.placeholder")}
          placeholderTextColor={colors.text.tertiary}
          multiline
          maxLength={500}
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{comment.length}/500</Text>
      </View>

      {/* Submit Button */}
      <Button
        label={t("exchange.rating.submit")}
        onPress={handleSubmit}
        variant="primary"
        size="lg"
        fullWidth
        loading={isSubmitting}
        disabled={rating === 0}
        style={styles.submitButton}
      />
    </BottomSheet>
  );
};

/**
 * Inline Rating Display
 *
 * Shows rating with stars inline.
 */
interface RatingDisplayProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  size = "md",
  showValue = true,
}) => {
  const iconSize = size === "sm" ? 12 : size === "md" ? 16 : 20;

  return (
    <View style={styles.ratingDisplay}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={
            star <= Math.round(rating)
              ? "star"
              : star - 0.5 <= rating
                ? "star-half"
                : "star-outline"
          }
          size={iconSize}
          color={colors.secondary[500]}
          style={styles.starIcon}
        />
      ))}
      {showValue && (
        <Text
          style={[styles.ratingValue, size === "sm" && styles.ratingValueSm]}
        >
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  partnerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
  },
  partnerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  partnerName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  existingRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  existingRatingText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  starsContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
  },
  starButton: {
    padding: spacing.xs,
  },
  ratingEmoji: {
    marginTop: spacing.md,
  },
  emojiText: {
    fontSize: 48,
  },
  commentContainer: {
    marginBottom: spacing.xl,
  },
  commentInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...typography.bodyMedium,
    color: colors.text.primary,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  charCount: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: "right",
    marginTop: spacing.xs,
  },
  submitButton: {
    marginBottom: spacing.md,
  },
  ratingDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  starIcon: {
    marginRight: 2,
  },
  ratingValue: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  ratingValueSm: {
    ...typography.caption,
  },
});
