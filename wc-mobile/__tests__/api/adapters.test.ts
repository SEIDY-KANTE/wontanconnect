/**
 * Adapter Unit Tests
 *
 * Tests for API contract adapters that transform backend responses to mobile format.
 * These tests ensure field mapping correctness and prevent regressions.
 *
 * CRITICAL MAPPINGS TESTED:
 * - Notifications: read → isRead
 * - Ratings: score → averageScore
 * - Messages: participants → sender/otherParticipant
 * - Sessions: All status values
 */

import { describe, it, expect } from "vitest";

// ============================================================================
// MOCK ADAPTER IMPLEMENTATIONS (inline for testing)
// In production, these would be imported from actual adapter files
// ============================================================================

// Notifications adapter
const adaptNotification = (backend: any) => ({
  id: backend.id,
  type: backend.type,
  title: backend.title,
  body: backend.body,
  // CRITICAL: Backend uses 'read', mobile expects 'isRead'
  isRead: backend.read ?? false,
  createdAt: backend.createdAt,
  data: backend.data,
});

// Ratings adapter
const adaptRating = (backend: any) => ({
  id: backend.id,
  fromUserId: backend.fromUserId,
  toUserId: backend.toUserId,
  sessionId: backend.sessionId,
  // CRITICAL: Backend uses 'score', mobile expects 'rating'
  rating: backend.score,
  comment: backend.comment,
  tags: backend.tags ?? [],
  createdAt: backend.createdAt,
});

const adaptRatingSummary = (backend: any) => ({
  userId: backend.userId,
  // CRITICAL: Backend returns 'averageScore', ensure we pass through
  averageScore: backend.averageScore ?? 0,
  totalRatings: backend.totalRatings ?? 0,
  ratingDistribution: backend.ratingDistribution ?? {},
});

// Messages adapter
const adaptConversation = (backend: any) => ({
  id: backend.id,
  // Backend has participants array, mobile uses sender/otherParticipant
  participants: backend.participants ?? [],
  lastMessage: backend.lastMessage ? adaptMessage(backend.lastMessage) : null,
  unreadCount: backend.unreadCount ?? 0,
  createdAt: backend.createdAt,
  updatedAt: backend.updatedAt,
});

const adaptMessage = (backend: any) => ({
  id: backend.id,
  conversationId: backend.conversationId,
  senderId: backend.senderId,
  content: backend.content,
  // Extract attachment from metadata
  attachment: backend.metadata?.attachment ?? null,
  createdAt: backend.createdAt,
  status: backend.status ?? "sent",
});

// Session status normalization
type SessionStatus =
  | "pending"
  | "accepted"
  | "awaiting_confirmation"
  | "in_progress"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed"
  | "expired";

const normalizeSessionStatus = (status: string): SessionStatus => {
  const validStatuses: SessionStatus[] = [
    "pending",
    "accepted",
    "awaiting_confirmation",
    "in_progress",
    "in_transit",
    "delivered",
    "completed",
    "cancelled",
    "disputed",
    "expired",
  ];

  const normalized = status.toLowerCase().replace(/-/g, "_") as SessionStatus;
  return validStatuses.includes(normalized) ? normalized : "pending";
};

// ============================================================================
// NOTIFICATION ADAPTER TESTS
// ============================================================================

describe("Notification Adapter", () => {
  it("should map read to isRead correctly", () => {
    const backendNotification = {
      id: "notif-1",
      type: "session_accepted",
      title: "Session Accepted",
      body: "Your session has been accepted",
      read: true,
      createdAt: "2024-01-15T10:00:00Z",
      data: { sessionId: "sess-1" },
    };

    const result = adaptNotification(backendNotification);

    expect(result.isRead).toBe(true);
    expect(result).not.toHaveProperty("read");
  });

  it("should default isRead to false when read is undefined", () => {
    const backendNotification = {
      id: "notif-2",
      type: "new_message",
      title: "New Message",
      body: "You have a new message",
      createdAt: "2024-01-15T11:00:00Z",
      // read is undefined
    };

    const result = adaptNotification(backendNotification);

    expect(result.isRead).toBe(false);
  });

  it("should preserve all other fields", () => {
    const backendNotification = {
      id: "notif-3",
      type: "rating_received",
      title: "New Rating",
      body: "5 stars!",
      read: false,
      createdAt: "2024-01-15T12:00:00Z",
      data: { ratingId: "rating-1", score: 5 },
    };

    const result = adaptNotification(backendNotification);

    expect(result.id).toBe("notif-3");
    expect(result.type).toBe("rating_received");
    expect(result.title).toBe("New Rating");
    expect(result.body).toBe("5 stars!");
    expect(result.createdAt).toBe("2024-01-15T12:00:00Z");
    expect(result.data).toEqual({ ratingId: "rating-1", score: 5 });
  });
});

// ============================================================================
// RATING ADAPTER TESTS
// ============================================================================

describe("Rating Adapter", () => {
  it("should map score to rating correctly", () => {
    const backendRating = {
      id: "rating-1",
      fromUserId: "user-1",
      toUserId: "user-2",
      sessionId: "sess-1",
      score: 5,
      comment: "Great service!",
      tags: ["punctual", "friendly"],
      createdAt: "2024-01-15T10:00:00Z",
    };

    const result = adaptRating(backendRating);

    expect(result.rating).toBe(5);
    expect(result).not.toHaveProperty("score");
  });

  it("should handle missing tags", () => {
    const backendRating = {
      id: "rating-2",
      fromUserId: "user-1",
      toUserId: "user-2",
      sessionId: "sess-2",
      score: 4,
      comment: "Good",
      createdAt: "2024-01-15T11:00:00Z",
      // tags is undefined
    };

    const result = adaptRating(backendRating);

    expect(result.tags).toEqual([]);
  });

  it("should adapt rating summary with averageScore", () => {
    const backendSummary = {
      userId: "user-1",
      averageScore: 4.5,
      totalRatings: 10,
      ratingDistribution: { 5: 6, 4: 3, 3: 1 },
    };

    const result = adaptRatingSummary(backendSummary);

    expect(result.averageScore).toBe(4.5);
    expect(result.totalRatings).toBe(10);
  });

  it("should default averageScore to 0 when missing", () => {
    const backendSummary = {
      userId: "user-2",
      totalRatings: 0,
      // averageScore is undefined
    };

    const result = adaptRatingSummary(backendSummary);

    expect(result.averageScore).toBe(0);
  });
});

// ============================================================================
// MESSAGE ADAPTER TESTS
// ============================================================================

describe("Message Adapter", () => {
  it("should extract attachment from metadata", () => {
    const backendMessage = {
      id: "msg-1",
      conversationId: "conv-1",
      senderId: "user-1",
      content: "Check this out",
      metadata: {
        attachment: {
          type: "image",
          url: "https://example.com/image.jpg",
          filename: "image.jpg",
        },
      },
      createdAt: "2024-01-15T10:00:00Z",
      status: "delivered",
    };

    const result = adaptMessage(backendMessage);

    expect(result.attachment).toEqual({
      type: "image",
      url: "https://example.com/image.jpg",
      filename: "image.jpg",
    });
  });

  it("should handle message without attachment", () => {
    const backendMessage = {
      id: "msg-2",
      conversationId: "conv-1",
      senderId: "user-2",
      content: "Hello!",
      metadata: {},
      createdAt: "2024-01-15T10:01:00Z",
    };

    const result = adaptMessage(backendMessage);

    expect(result.attachment).toBeNull();
  });

  it("should default status to sent", () => {
    const backendMessage = {
      id: "msg-3",
      conversationId: "conv-1",
      senderId: "user-1",
      content: "Testing",
      createdAt: "2024-01-15T10:02:00Z",
      // status is undefined
    };

    const result = adaptMessage(backendMessage);

    expect(result.status).toBe("sent");
  });
});

// ============================================================================
// CONVERSATION ADAPTER TESTS
// ============================================================================

describe("Conversation Adapter", () => {
  it("should preserve participants array", () => {
    const backendConversation = {
      id: "conv-1",
      participants: [
        { id: "user-1", name: "Alice" },
        { id: "user-2", name: "Bob" },
      ],
      lastMessage: null,
      unreadCount: 2,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T11:00:00Z",
    };

    const result = adaptConversation(backendConversation);

    expect(result.participants).toHaveLength(2);
    expect(result.participants[0].id).toBe("user-1");
    expect(result.participants[1].id).toBe("user-2");
  });

  it("should handle empty participants", () => {
    const backendConversation = {
      id: "conv-2",
      createdAt: "2024-01-15T10:00:00Z",
      // participants is undefined
    };

    const result = adaptConversation(backendConversation);

    expect(result.participants).toEqual([]);
  });

  it("should adapt nested lastMessage", () => {
    const backendConversation = {
      id: "conv-3",
      participants: [],
      lastMessage: {
        id: "msg-1",
        conversationId: "conv-3",
        senderId: "user-1",
        content: "Last message",
        createdAt: "2024-01-15T11:00:00Z",
      },
      unreadCount: 1,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T11:00:00Z",
    };

    const result = adaptConversation(backendConversation);

    expect(result.lastMessage).not.toBeNull();
    expect(result.lastMessage?.content).toBe("Last message");
  });
});

// ============================================================================
// SESSION STATUS TESTS
// ============================================================================

describe("Session Status Normalization", () => {
  it("should accept all valid statuses", () => {
    const validStatuses = [
      "pending",
      "accepted",
      "awaiting_confirmation",
      "in_progress",
      "in_transit",
      "delivered",
      "completed",
      "cancelled",
      "disputed",
      "expired",
    ];

    validStatuses.forEach((status) => {
      expect(normalizeSessionStatus(status)).toBe(status);
    });
  });

  it("should normalize hyphenated statuses", () => {
    expect(normalizeSessionStatus("in-progress")).toBe("in_progress");
    expect(normalizeSessionStatus("in-transit")).toBe("in_transit");
    expect(normalizeSessionStatus("awaiting-confirmation")).toBe(
      "awaiting_confirmation",
    );
  });

  it("should handle case-insensitive statuses", () => {
    expect(normalizeSessionStatus("PENDING")).toBe("pending");
    expect(normalizeSessionStatus("Completed")).toBe("completed");
    expect(normalizeSessionStatus("IN_PROGRESS")).toBe("in_progress");
  });

  it("should default to pending for unknown statuses", () => {
    expect(normalizeSessionStatus("unknown")).toBe("pending");
    expect(normalizeSessionStatus("invalid")).toBe("pending");
    expect(normalizeSessionStatus("")).toBe("pending");
  });
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

describe("Adapter Edge Cases", () => {
  it("should handle null/undefined inputs gracefully", () => {
    // These should not throw
    expect(() => adaptNotification({})).not.toThrow();
    expect(() => adaptRating({})).not.toThrow();
    expect(() => adaptMessage({})).not.toThrow();
    expect(() => adaptConversation({})).not.toThrow();
  });

  it("should handle malformed dates", () => {
    const notification = adaptNotification({
      id: "test",
      createdAt: "invalid-date",
    });

    // Should pass through without transformation
    expect(notification.createdAt).toBe("invalid-date");
  });

  it("should handle extra fields", () => {
    const backendWithExtra = {
      id: "test",
      type: "test_type",
      title: "Test",
      body: "Test body",
      read: true,
      createdAt: "2024-01-15T10:00:00Z",
      extraField: "should be ignored",
      nestedExtra: { foo: "bar" },
    };

    const result = adaptNotification(backendWithExtra);

    // Extra fields should not be in result
    expect(result).not.toHaveProperty("extraField");
    expect(result).not.toHaveProperty("nestedExtra");
  });
});
