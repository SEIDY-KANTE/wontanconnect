/**
 * Shipping Offer Card Component
 */

import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  GestureResponderEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { ShippingOffer } from "../model/types";
import { shippingTypeIcons } from "../data/mockData";
import { countryFlags } from "@/data/locations";
import { Card, Avatar, Tag } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { getStatusTagVariant } from "@/utils/status";

interface ShippingOfferCardProps {
  offer: ShippingOffer;
  onPress: () => void;
  showStatusBadge?: boolean;
  onActionPress?: () => void;
}

export const ShippingOfferCard: React.FC<ShippingOfferCardProps> = ({
  offer,
  onPress,
  showStatusBadge = false,
  onActionPress,
}) => {
  const { t } = useTranslation();

  const fromFlag = countryFlags[offer.fromCountry] || "🌍";
  const toFlag = countryFlags[offer.toCountry] || "🌍";
  const typeIcon = shippingTypeIcons[
    offer.type
  ] as keyof typeof Ionicons.glyphMap;
  const statusVariant = getStatusTagVariant(offer.status);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const handleActionPress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onActionPress?.();
  };

  return (
    <Card onPress={onPress} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar
          source={offer.user.avatar}
          name={offer.user.name}
          size="md"
          verified={offer.user.isVerified}
        />
        <View style={styles.headerText}>
          <Text style={styles.userName}>{offer.user.name}</Text>
          <View style={styles.ratingRow}>
            {offer.user.rating != null && offer.user.rating > 0 && (
              <View style={styles.rating}>
                <Ionicons name="star" size={12} color={colors.secondary[500]} />
                <Text style={styles.ratingText}>{offer.user.rating}</Text>
              </View>
            )}
            {offer.user.totalDeals != null && offer.user.totalDeals > 0 && (
              <Text style={styles.dealsText}>
                • {offer.user.totalDeals}{" "}
                {t("profile.stats.deals").toLowerCase()}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          {showStatusBadge && (
            <Tag
              label={t(`common.status.${offer.status}`)}
              variant={statusVariant}
              size="sm"
            />
          )}
          <Tag
            label={t(`shipping.types.${offer.type}`)}
            variant="info"
            size="sm"
            icon={
              <Ionicons name={typeIcon} size={12} color={colors.info.dark} />
            }
          />
          {onActionPress && (
            <TouchableOpacity
              onPress={handleActionPress}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel={t("common.edit")}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={18}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <Text style={styles.routeFlag}>{fromFlag}</Text>
          <Text style={styles.routeCity}>{offer.fromCity}</Text>
        </View>

        <View style={styles.routeLine}>
          <View style={styles.routeDot} />
          <View style={styles.routeDash} />
          <Ionicons name="airplane" size={16} color={colors.primary[500]} />
          <View style={styles.routeDash} />
          <View style={styles.routeDot} />
        </View>

        <View style={styles.routePoint}>
          <Text style={styles.routeFlag}>{toFlag}</Text>
          <Text style={styles.routeCity}>{offer.toCity}</Text>
        </View>
      </View>

      {/* Info Row */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.text.tertiary}
          />
          <Text style={styles.infoText}>{formatDate(offer.departureDate)}</Text>
        </View>

        {offer.capacity && (
          <View style={styles.infoItem}>
            <Ionicons
              name="cube-outline"
              size={16}
              color={colors.text.tertiary}
            />
            <Text style={styles.infoText}>{offer.capacity}</Text>
          </View>
        )}

        {offer.price && (
          <View style={styles.infoItem}>
            <Ionicons
              name="pricetag-outline"
              size={16}
              color={colors.text.tertiary}
            />
            <Text style={styles.infoText}>{offer.price}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.postedDate}>{formatDate(offer.createdAt)}</Text>
        <View style={styles.viewDetails}>
          <Text style={styles.viewDetailsText}>{t("common.seeAll")}</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.primary[600]}
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    ...typography.labelLarge,
    color: colors.text.primary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xxs,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: 2,
  },
  dealsText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginLeft: spacing.xs,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  routeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  routePoint: {
    alignItems: "center",
    width: 80,
  },
  routeFlag: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  routeCity: {
    ...typography.labelMedium,
    color: colors.text.primary,
    textAlign: "center",
  },
  routeLine: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  routeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[400],
  },
  routeDash: {
    flex: 1,
    height: 2,
    backgroundColor: colors.primary[200],
    marginHorizontal: spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
    paddingTop: spacing.md,
  },
  postedDate: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  viewDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    ...typography.labelMedium,
    color: colors.primary[600],
  },
});
