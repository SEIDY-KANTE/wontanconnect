/**
 * FX Exchange Types
 */

export type Currency = "GNF" | "EUR" | "USD" | "TRY" | "XOF";

export type FXOfferType = "buying" | "selling";

export type FXOfferStatus = "active" | "completed" | "cancelled";

/**
 * Extended status for partial fill tracking
 */
export type FXOfferFillStatus = "OPEN" | "PARTIALLY_FILLED" | "FILLED";

export interface User {
  id: string;
  name: string;
  avatar?: string;
  country: string;
  city: string;
  isVerified: boolean;
  rating?: number;
  totalDeals?: number;
  completedExchanges?: number;
}

export interface FXOffer {
  id: string;
  type: FXOfferType;
  fromCurrency: Currency;
  toCurrency: Currency;
  amountFrom: number;
  amountTo?: number;
  rate?: number;
  description?: string;
  location: {
    country: string;
    city: string;
  };
  user: User;
  status: FXOfferStatus;
  /** For tracking partial fills */
  fillStatus?: FXOfferFillStatus;
  /** Remaining amount available (for partial takes) */
  remainingAmount?: number;
  /** Number of pending exchange requests */
  pendingRequestsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FXOfferFormData {
  type: FXOfferType;
  fromCurrency: Currency;
  toCurrency: Currency;
  amountFrom: string;
  amountTo: string;
  rate: string;
  description: string;
}
