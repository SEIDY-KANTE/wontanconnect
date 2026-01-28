/**
 * Session Status State Machine
 *
 * Complete status handling including backend statuses not previously handled:
 * - awaiting_confirmation (after both parties agree)
 * - disputed (when there's a problem)
 *
 * WHY: Backend has more statuses than mobile previously handled.
 * HOW: State machine validates transitions, UI components handle all states.
 * VERIFY: Test all status transitions, verify UI displays all states.
 */

import { SessionStatus } from "./sessions";

// ============================================================================
// COMPLETE STATUS ENUM (including backend statuses not in original)
// ============================================================================

/**
 * All possible session statuses from backend
 */
export type ExtendedSessionStatus =
  | "pending" // Initial state after creation
  | "accepted" // Responder accepted the request
  | "rejected" // Responder rejected the request
  | "awaiting_confirmation" // Both agreed, waiting for exchange confirmation
  | "confirmed" // Exchange confirmed by one party
  | "disputed" // Problem reported
  | "in_progress" // Exchange is happening (FX) / in transit (shipping)
  | "in_transit" // Shipping: package is being delivered
  | "delivered" // Shipping: package arrived
  | "completed" // Successfully finished
  | "cancelled"; // Cancelled by either party

// ============================================================================
// STATE MACHINE
// ============================================================================

/**
 * Valid transitions from each status
 *
 * CRITICAL: This must match backend validation in sessions/service.ts
 */
export const VALID_SESSION_TRANSITIONS: Record<
  ExtendedSessionStatus,
  ExtendedSessionStatus[]
> = {
  // Initial state
  pending: ["accepted", "rejected", "cancelled"],

  // After acceptance
  accepted: ["awaiting_confirmation", "in_progress", "cancelled"],

  // Rejected is terminal
  rejected: [],

  // Awaiting both parties to confirm
  awaiting_confirmation: ["confirmed", "disputed", "cancelled"],

  // After first confirmation
  confirmed: ["in_progress", "in_transit", "disputed", "cancelled"],

  // Dispute can be resolved
  disputed: ["confirmed", "completed", "cancelled"],

  // Active exchange (FX)
  in_progress: ["completed", "disputed", "cancelled"],

  // Shipping states
  in_transit: ["delivered", "disputed"],
  delivered: ["completed", "disputed"],

  // Terminal states
  completed: [],
  cancelled: [],
};

/**
 * Check if a status transition is valid
 */
export function canTransitionTo(
  currentStatus: ExtendedSessionStatus,
  newStatus: ExtendedSessionStatus,
): boolean {
  const allowedTransitions = VALID_SESSION_TRANSITIONS[currentStatus];
  return allowedTransitions?.includes(newStatus) ?? false;
}

/**
 * Check if a status is terminal (no further transitions possible)
 */
export function isTerminalStatus(status: ExtendedSessionStatus): boolean {
  return VALID_SESSION_TRANSITIONS[status]?.length === 0;
}

/**
 * Check if a session is considered "active" (not terminal)
 */
export function isActiveStatus(status: ExtendedSessionStatus): boolean {
  const activeStatuses: ExtendedSessionStatus[] = [
    "pending",
    "accepted",
    "awaiting_confirmation",
    "confirmed",
    "in_progress",
    "in_transit",
    "delivered",
    "disputed",
  ];
  return activeStatuses.includes(status);
}

/**
 * Check if a session requires user action
 */
export function requiresAction(
  status: ExtendedSessionStatus,
  isInitiator: boolean,
  hasConfirmed: boolean,
): boolean {
  switch (status) {
    case "pending":
      return !isInitiator; // Responder needs to accept/reject
    case "accepted":
    case "awaiting_confirmation":
      return !hasConfirmed; // Needs to confirm exchange
    case "in_progress":
    case "in_transit":
      return !hasConfirmed; // Needs to confirm completion/delivery
    case "disputed":
      return true; // Both parties need to resolve
    default:
      return false;
  }
}

// ============================================================================
// STATUS DISPLAY CONFIGURATION
// ============================================================================

export interface StatusDisplayConfig {
  label: string;
  shortLabel: string;
  color: string;
  backgroundColor: string;
  icon: string;
  description: string;
  actionLabel?: string; // What action user can take
}

/**
 * Complete display configuration for all statuses
 */
export const SESSION_STATUS_CONFIG: Record<
  ExtendedSessionStatus,
  StatusDisplayConfig
> = {
  pending: {
    label: "Pending",
    shortLabel: "Pending",
    color: "#F57C00",
    backgroundColor: "#FFF3E0",
    icon: "clock-outline",
    description: "Waiting for the other party to respond",
    actionLabel: "Accept / Decline",
  },
  accepted: {
    label: "Accepted",
    shortLabel: "Accepted",
    color: "#388E3C",
    backgroundColor: "#E8F5E9",
    icon: "check-circle-outline",
    description: "Request accepted, proceed to exchange",
    actionLabel: "Start Exchange",
  },
  rejected: {
    label: "Rejected",
    shortLabel: "Rejected",
    color: "#D32F2F",
    backgroundColor: "#FFEBEE",
    icon: "close-circle-outline",
    description: "Request was declined",
  },
  awaiting_confirmation: {
    label: "Awaiting Confirmation",
    shortLabel: "Awaiting",
    color: "#1976D2",
    backgroundColor: "#E3F2FD",
    icon: "timer-sand",
    description: "Waiting for both parties to confirm the exchange",
    actionLabel: "Confirm Exchange",
  },
  confirmed: {
    label: "Confirmed",
    shortLabel: "Confirmed",
    color: "#388E3C",
    backgroundColor: "#E8F5E9",
    icon: "check-decagram",
    description: "Exchange confirmed, ready to proceed",
    actionLabel: "Mark Complete",
  },
  disputed: {
    label: "Disputed",
    shortLabel: "Disputed",
    color: "#D32F2F",
    backgroundColor: "#FFEBEE",
    icon: "alert-circle",
    description: "A problem has been reported",
    actionLabel: "Resolve Dispute",
  },
  in_progress: {
    label: "In Progress",
    shortLabel: "Active",
    color: "#1976D2",
    backgroundColor: "#E3F2FD",
    icon: "progress-clock",
    description: "Exchange is currently happening",
    actionLabel: "Complete Exchange",
  },
  in_transit: {
    label: "In Transit",
    shortLabel: "Transit",
    color: "#7B1FA2",
    backgroundColor: "#F3E5F5",
    icon: "truck-delivery",
    description: "Package is on the way",
    actionLabel: "Mark Delivered",
  },
  delivered: {
    label: "Delivered",
    shortLabel: "Delivered",
    color: "#388E3C",
    backgroundColor: "#E8F5E9",
    icon: "package-variant-closed-check",
    description: "Package has been delivered",
    actionLabel: "Confirm Receipt",
  },
  completed: {
    label: "Completed",
    shortLabel: "Done",
    color: "#388E3C",
    backgroundColor: "#E8F5E9",
    icon: "check-all",
    description: "Exchange successfully completed",
  },
  cancelled: {
    label: "Cancelled",
    shortLabel: "Cancelled",
    color: "#757575",
    backgroundColor: "#F5F5F5",
    icon: "cancel",
    description: "This exchange was cancelled",
  },
};

/**
 * Get display config for a status
 */
export function getStatusConfig(
  status: ExtendedSessionStatus,
): StatusDisplayConfig {
  return SESSION_STATUS_CONFIG[status] || SESSION_STATUS_CONFIG.pending;
}

/**
 * Map old status to new status (for backward compatibility)
 */
export function normalizeStatus(status: string): ExtendedSessionStatus {
  const statusMap: Record<string, ExtendedSessionStatus> = {
    // Direct mappings
    pending: "pending",
    accepted: "accepted",
    rejected: "rejected",
    awaiting_confirmation: "awaiting_confirmation",
    confirmed: "confirmed",
    disputed: "disputed",
    in_progress: "in_progress",
    in_transit: "in_transit",
    delivered: "delivered",
    completed: "completed",
    cancelled: "cancelled",

    // Legacy/alternative names
    active: "in_progress",
    done: "completed",
    closed: "completed",
    expired: "cancelled",
  };

  return statusMap[status.toLowerCase()] || "pending";
}

// ============================================================================
// STATUS FLOW HELPERS
// ============================================================================

/**
 * Get the expected next status based on current status and offer type
 */
export function getExpectedNextStatus(
  currentStatus: ExtendedSessionStatus,
  offerType: "fx" | "shipping",
  action: "accept" | "confirm" | "progress" | "complete" | "dispute" | "cancel",
): ExtendedSessionStatus | null {
  const flows: Record<string, Record<string, ExtendedSessionStatus>> = {
    pending: {
      accept: "accepted",
      cancel: "cancelled",
    },
    accepted: {
      confirm: "awaiting_confirmation",
      progress: offerType === "fx" ? "in_progress" : "awaiting_confirmation",
      cancel: "cancelled",
    },
    awaiting_confirmation: {
      confirm: "confirmed",
      dispute: "disputed",
      cancel: "cancelled",
    },
    confirmed: {
      progress: offerType === "fx" ? "in_progress" : "in_transit",
      dispute: "disputed",
      cancel: "cancelled",
    },
    in_progress: {
      complete: "completed",
      dispute: "disputed",
    },
    in_transit: {
      progress: "delivered",
      dispute: "disputed",
    },
    delivered: {
      complete: "completed",
      dispute: "disputed",
    },
    disputed: {
      confirm: "confirmed",
      complete: "completed",
      cancel: "cancelled",
    },
  };

  return flows[currentStatus]?.[action] ?? null;
}

/**
 * Get available actions for a status
 */
export function getAvailableActions(
  status: ExtendedSessionStatus,
  isInitiator: boolean,
  offerType: "fx" | "shipping",
): Array<{
  action: string;
  label: string;
  variant: "primary" | "secondary" | "danger";
}> {
  const actions: Array<{
    action: string;
    label: string;
    variant: "primary" | "secondary" | "danger";
  }> = [];

  switch (status) {
    case "pending":
      if (!isInitiator) {
        actions.push({ action: "accept", label: "Accept", variant: "primary" });
        actions.push({ action: "reject", label: "Decline", variant: "danger" });
      } else {
        actions.push({
          action: "cancel",
          label: "Cancel Request",
          variant: "secondary",
        });
      }
      break;

    case "accepted":
    case "awaiting_confirmation":
      actions.push({
        action: "confirm",
        label: "Confirm Exchange",
        variant: "primary",
      });
      actions.push({ action: "cancel", label: "Cancel", variant: "secondary" });
      break;

    case "confirmed":
      if (offerType === "fx") {
        actions.push({
          action: "progress",
          label: "Start Exchange",
          variant: "primary",
        });
      } else {
        actions.push({
          action: "progress",
          label: "Mark as Shipped",
          variant: "primary",
        });
      }
      actions.push({
        action: "dispute",
        label: "Report Issue",
        variant: "danger",
      });
      break;

    case "in_progress":
      actions.push({
        action: "complete",
        label: "Complete Exchange",
        variant: "primary",
      });
      actions.push({
        action: "dispute",
        label: "Report Issue",
        variant: "danger",
      });
      break;

    case "in_transit":
      if (!isInitiator) {
        actions.push({
          action: "progress",
          label: "Mark as Delivered",
          variant: "primary",
        });
      }
      actions.push({
        action: "dispute",
        label: "Report Issue",
        variant: "danger",
      });
      break;

    case "delivered":
      if (isInitiator) {
        actions.push({
          action: "complete",
          label: "Confirm Receipt",
          variant: "primary",
        });
      }
      actions.push({
        action: "dispute",
        label: "Report Issue",
        variant: "danger",
      });
      break;

    case "disputed":
      actions.push({
        action: "confirm",
        label: "Resolve Issue",
        variant: "primary",
      });
      actions.push({
        action: "cancel",
        label: "Cancel Exchange",
        variant: "danger",
      });
      break;
  }

  return actions;
}

// ============================================================================
// PROGRESS INDICATORS
// ============================================================================

/**
 * Get progress percentage for a status (for progress bars)
 */
export function getStatusProgress(
  status: ExtendedSessionStatus,
  offerType: "fx" | "shipping",
): number {
  const fxProgress: Record<ExtendedSessionStatus, number> = {
    pending: 10,
    accepted: 25,
    awaiting_confirmation: 40,
    confirmed: 55,
    in_progress: 75,
    completed: 100,
    rejected: 0,
    disputed: 50,
    cancelled: 0,
    in_transit: 75,
    delivered: 90,
  };

  const shippingProgress: Record<ExtendedSessionStatus, number> = {
    pending: 10,
    accepted: 20,
    awaiting_confirmation: 30,
    confirmed: 40,
    in_progress: 50,
    in_transit: 70,
    delivered: 90,
    completed: 100,
    rejected: 0,
    disputed: 50,
    cancelled: 0,
  };

  const progressMap = offerType === "fx" ? fxProgress : shippingProgress;
  return progressMap[status] ?? 0;
}

/**
 * Get status steps for a timeline/stepper component
 */
export function getStatusSteps(
  offerType: "fx" | "shipping",
): Array<{ status: ExtendedSessionStatus; label: string }> {
  if (offerType === "fx") {
    return [
      { status: "pending", label: "Request Sent" },
      { status: "accepted", label: "Accepted" },
      { status: "awaiting_confirmation", label: "Confirm Details" },
      { status: "confirmed", label: "Ready" },
      { status: "in_progress", label: "Exchanging" },
      { status: "completed", label: "Complete" },
    ];
  }

  return [
    { status: "pending", label: "Request Sent" },
    { status: "accepted", label: "Accepted" },
    { status: "awaiting_confirmation", label: "Confirm Details" },
    { status: "confirmed", label: "Ready to Ship" },
    { status: "in_transit", label: "In Transit" },
    { status: "delivered", label: "Delivered" },
    { status: "completed", label: "Complete" },
  ];
}

/**
 * Get current step index for timeline
 */
export function getCurrentStepIndex(
  status: ExtendedSessionStatus,
  offerType: "fx" | "shipping",
): number {
  const steps = getStatusSteps(offerType);
  const index = steps.findIndex((s) => s.status === status);

  // Handle non-standard statuses
  if (index === -1) {
    if (status === "rejected" || status === "cancelled") return -1; // Terminal failure
    if (status === "disputed") return steps.length - 2; // Before completion
  }

  return index;
}
