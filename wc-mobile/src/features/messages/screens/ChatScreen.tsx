/**
 * Chat Screen
 *
 * Professional, exchange-aware messaging system supporting:
 * - Typing indicators
 * - Seen/delivered states
 * - File messages (images, documents)
 * - Emoji picker
 * - System messages
 * - Read-only state after exchange completion
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { MessagesScreenProps } from "@/core/navigation/types";
import { mockUsers, currentUser } from "../data/mockData";
import {
  Message,
  isSystemMessage,
  isImageMessage,
  isDocumentMessage,
  isTextMessage,
  TextContent,
  isConversationReadOnly,
} from "../model/types";
import {
  useMessagesStore,
  useConversationMessages,
  useTypingIndicator,
  useConversationReadOnly,
} from "../store/messagesStore";
import {
  ChatMessageBubble,
  SystemMessageBubble,
  TypingIndicator,
  FileMessageCard,
  EmojiPicker,
  ChatInputBar,
  AttachmentPickerSheet,
} from "../components";
import { Avatar } from "@/components";
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { shadows } from "@/design/tokens/shadows";
import { gradients } from "@/design/tokens/gradients";
import { useExchangeSession } from "@/features/exchange/hooks/useExchange";
import {
  isFXExchange,
  getStatusInfo,
  FXAgreedAmount,
  ShippingAgreedAmount,
} from "@/features/exchange/model/types";

export const ChatScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<MessagesScreenProps<"Chat">["navigation"]>();
  const route = useRoute<MessagesScreenProps<"Chat">["route"]>();
  const insets = useSafeAreaInsets();

  const { conversationId, recipientName, exchangeId } = route.params;
  const flatListRef = useRef<FlatList>(null);

  // Store hooks
  const { messages, loadMessages, isLoading } =
    useConversationMessages(conversationId);
  const sendTextMessage = useMessagesStore((state) => state.sendTextMessage);
  const sendImageMessage = useMessagesStore((state) => state.sendImageMessage);
  const sendDocumentMessage = useMessagesStore(
    (state) => state.sendDocumentMessage,
  );
  const markMessagesAsSeen = useMessagesStore(
    (state) => state.markMessagesAsSeen,
  );
  const updateExchangeContext = useMessagesStore(
    (state) => state.updateConversationExchangeContext,
  );
  const isSending = useMessagesStore((state) => state.isSending);

  // Get other user info
  const recipientUser = mockUsers.find(
    (u) => `conv-${u.id}` === conversationId,
  );
  const otherUserId = conversationId.replace("conv-", "");

  // Typing indicator
  const { isOtherUserTyping, startTyping, stopTyping } = useTypingIndicator(
    conversationId,
    otherUserId,
  );

  // Mock other user typing occasionally
  const [mockOtherTyping, setMockOtherTyping] = useState(false);

  // Exchange context
  const { session: exchangeSession } = useExchangeSession(exchangeId || "");
  const exchangeStatus = exchangeSession?.status;
  const isReadOnly = isConversationReadOnly(exchangeStatus);

  // Exchange info for header
  const exchangeInfo = useMemo(() => {
    if (!exchangeSession) return null;
    return {
      type: exchangeSession.type,
      status: getStatusInfo(exchangeSession),
      amount: exchangeSession.agreedAmount,
    };
  }, [exchangeSession]);

  // UI state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<any>(null);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
    markMessagesAsSeen(conversationId);
  }, [conversationId]);

  // Stop typing indicator when leaving chat
  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);

  // Update exchange context when session changes
  useEffect(() => {
    if (exchangeSession) {
      updateExchangeContext(
        conversationId,
        exchangeSession.id,
        exchangeSession.type,
        exchangeSession.status,
      );
    }
  }, [exchangeSession?.status]);

  // Reverse messages for inverted FlatList
  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [messages]);

  // Handlers
  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim() || isReadOnly) return;
      sendTextMessage(conversationId, text, exchangeId);
    },
    [conversationId, exchangeId, isReadOnly, sendTextMessage],
  );

  const handleEmojiSelect = useCallback((emoji: string) => {
    setInputText((prev) => prev + emoji);
  }, []);

  const handleAttachImage = useCallback(() => {
    // Mock image attachment
    sendImageMessage(
      conversationId,
      {
        uri: "https://picsum.photos/400/300",
        width: 400,
        height: 300,
      },
      exchangeId,
    );
    Alert.alert("Photo sent", "Your photo has been sent (mock).");
  }, [conversationId, exchangeId, sendImageMessage]);

  const handleAttachDocument = useCallback(() => {
    // Mock document attachment
    sendDocumentMessage(
      conversationId,
      {
        uri: "file://document.pdf",
        fileName: "Contract_2026.pdf",
        fileSize: 245000,
        mimeType: "application/pdf",
      },
      exchangeId,
    );
    Alert.alert("Document sent", "Your document has been sent (mock).");
  }, [conversationId, exchangeId, sendDocumentMessage]);

  // Format functions
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      return t("messages.today");
    } else if (diffDays === 1) {
      return t("messages.yesterday");
    } else {
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
      });
    }
  };

  // Render message item
  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isMe = item.senderId === currentUser.id;
      const showDateHeader =
        index === sortedMessages.length - 1 ||
        new Date(item.createdAt).toDateString() !==
          new Date(sortedMessages[index + 1]?.createdAt).toDateString();

      // System message
      if (isSystemMessage(item)) {
        return (
          <Animated.View entering={FadeInUp.delay(50)}>
            {showDateHeader && (
              <View style={styles.dateHeader}>
                <Text style={styles.dateHeaderText}>
                  {formatDateHeader(item.createdAt)}
                </Text>
              </View>
            )}
            <SystemMessageBubble message={item} />
          </Animated.View>
        );
      }

      // Image or Document message
      if (isImageMessage(item) || isDocumentMessage(item)) {
        return (
          <Animated.View entering={FadeInUp.delay(50)}>
            {showDateHeader && (
              <View style={styles.dateHeader}>
                <Text style={styles.dateHeaderText}>
                  {formatDateHeader(item.createdAt)}
                </Text>
              </View>
            )}
            <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
              {!isMe && (
                <Avatar
                  source={recipientUser?.avatar}
                  name={recipientName}
                  size="sm"
                />
              )}
              <FileMessageCard message={item} isMe={isMe} />
            </View>
          </Animated.View>
        );
      }

      // Text message
      return (
        <Animated.View entering={FadeInUp.delay(50)}>
          {showDateHeader && (
            <View style={styles.dateHeader}>
              <Text style={styles.dateHeaderText}>
                {formatDateHeader(item.createdAt)}
              </Text>
            </View>
          )}
          <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
            {!isMe && (
              <Avatar
                source={recipientUser?.avatar}
                name={recipientName}
                size="sm"
              />
            )}
            <ChatMessageBubble message={item} isMe={isMe} />
          </View>
        </Animated.View>
      );
    },
    [sortedMessages, recipientName, recipientUser],
  );

  // Get read-only message based on exchange status
  const getReadOnlyMessage = () => {
    if (exchangeStatus === "COMPLETED") {
      return t("exchange.chat.chatLocked");
    }
    if (exchangeStatus === "CANCELLED") {
      return t("exchange.chat.chatLockedCancelled");
    }
    return t("exchange.chat.chatLocked");
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Avatar
            source={recipientUser?.avatar}
            name={recipientName}
            size="sm"
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{recipientName}</Text>
            {mockOtherTyping ? (
              <Text style={styles.headerTyping}>typing...</Text>
            ) : recipientUser?.isOnline ? (
              <Text style={styles.headerStatus}>Online</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.headerRight} />
      </LinearGradient>

      {/* Exchange Context Banner */}
      {exchangeInfo && (
        <Animated.View entering={FadeInDown.delay(100)}>
          <TouchableOpacity
            style={styles.exchangeBanner}
            onPress={() => {
              navigation.getParent()?.navigate("ProfileTab", {
                screen: "ExchangeDetail",
                params: { exchangeId: exchangeId! },
              });
            }}
          >
            <View style={styles.exchangeBannerLeft}>
              <View
                style={[
                  styles.exchangeIcon,
                  {
                    backgroundColor:
                      exchangeInfo.type === "FX"
                        ? colors.primary[100]
                        : colors.info.light,
                  },
                ]}
              >
                <Ionicons
                  name={exchangeInfo.type === "FX" ? "swap-horizontal" : "cube"}
                  size={16}
                  color={
                    exchangeInfo.type === "FX"
                      ? colors.primary[600]
                      : colors.info.dark
                  }
                />
              </View>
              <View style={styles.exchangeBannerInfo}>
                <Text style={styles.exchangeBannerTitle}>
                  {t("exchange.chat.exchangeInfo")}
                </Text>
                {exchangeInfo.type === "FX" &&
                  isFXExchange(exchangeSession!) && (
                    <Text style={styles.exchangeBannerAmount}>
                      {(
                        exchangeSession.agreedAmount as FXAgreedAmount
                      ).fromAmount.toLocaleString()}{" "}
                      {
                        (exchangeSession.agreedAmount as FXAgreedAmount)
                          .fromCurrency
                      }{" "}
                      →{" "}
                      {(exchangeSession.agreedAmount as FXAgreedAmount)
                        .toAmount !== undefined
                        ? `${(exchangeSession.agreedAmount as FXAgreedAmount).toAmount!.toLocaleString()} ${(exchangeSession.agreedAmount as FXAgreedAmount).toCurrency}`
                        : t("common.negotiable", "TBD")}
                    </Text>
                  )}
                {exchangeInfo.type === "SHIPPING" && (
                  <Text style={styles.exchangeBannerAmount} numberOfLines={1}>
                    {
                      (exchangeSession!.agreedAmount as ShippingAgreedAmount)
                        .description
                    }
                  </Text>
                )}
              </View>
            </View>
            <View
              style={[
                styles.exchangeStatus,
                { backgroundColor: exchangeInfo.status.color + "20" },
              ]}
            >
              <Text
                style={[
                  styles.exchangeStatusText,
                  { color: exchangeInfo.status.color },
                ]}
              >
                {t(`exchange.status.${exchangeInfo.status.key}`)}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Read-only Banner */}
      {isReadOnly && (
        <Animated.View
          entering={FadeInDown.delay(150)}
          style={styles.readOnlyBanner}
        >
          <Ionicons name="lock-closed" size={16} color={colors.warning.dark} />
          <Text style={styles.readOnlyBannerText}>{getReadOnlyMessage()}</Text>
        </Animated.View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={sortedMessages}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          inverted
          ListHeaderComponent={
            mockOtherTyping ? (
              <TypingIndicator userName={recipientName} visible />
            ) : null
          }
        />

        {/* Emoji Picker */}
        <EmojiPicker
          visible={showEmojiPicker}
          onSelect={(emoji) => {
            handleEmojiSelect(emoji);
            setShowEmojiPicker(false);
          }}
          onClose={() => setShowEmojiPicker(false)}
        />

        {/* Input Bar */}
        <View style={{ paddingBottom: insets.bottom || spacing.base }}>
          <ChatInputBar
            onSend={handleSend}
            onAttachPress={() => setShowAttachmentPicker(true)}
            onEmojiPress={() => setShowEmojiPicker(!showEmojiPicker)}
            onTypingStart={startTyping}
            onTypingStop={stopTyping}
            isReadOnly={isReadOnly}
            readOnlyMessage={getReadOnlyMessage()}
            placeholder={t("messages.inputPlaceholder")}
            isSending={isSending}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Attachment Picker */}
      <AttachmentPickerSheet
        visible={showAttachmentPicker}
        onClose={() => setShowAttachmentPicker(false)}
        onSelectImage={handleAttachImage}
        onSelectDocument={handleAttachDocument}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  headerInfo: {
    marginLeft: spacing.md,
  },
  headerName: {
    ...typography.labelLarge,
    color: colors.text.primary,
  },
  headerStatus: {
    ...typography.caption,
    color: colors.success.main,
  },
  headerTyping: {
    ...typography.caption,
    color: colors.primary[600],
    fontStyle: "italic",
  },
  headerRight: {
    width: 36,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  dateHeader: {
    alignItems: "center",
    marginVertical: spacing.md,
  },
  dateHeaderText: {
    ...typography.caption,
    color: colors.text.tertiary,
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: spacing.sm,
    maxWidth: "85%",
  },
  messageRowMe: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  // Exchange banner
  exchangeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  exchangeBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
  },
  exchangeIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  exchangeBannerInfo: {
    flex: 1,
  },
  exchangeBannerTitle: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  exchangeBannerAmount: {
    ...typography.labelMedium,
    color: colors.text.primary,
  },
  exchangeStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    marginLeft: spacing.sm,
  },
  exchangeStatusText: {
    ...typography.captionSmall,
    fontWeight: "600",
  },
  // Read-only banner
  readOnlyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.warning.light,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  readOnlyBannerText: {
    ...typography.bodySmall,
    color: colors.warning.dark,
  },
});
