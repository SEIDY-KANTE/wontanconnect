/**
 * Shipping Types
 */

export type ShippingType = 'parcel' | 'container' | 'vehicle';

export type ShippingStatus = 'active' | 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  country: string;
  city: string;
  isVerified: boolean;
  rating?: number;
  totalDeals?: number;
}

export interface ShippingOffer {
  id: string;
  type: ShippingType;
  fromCity: string;
  fromCountry: string;
  toCity: string;
  toCountry: string;
  departureDate: string;
  capacity?: string;
  price?: string;
  description?: string;
  user: User;
  status: ShippingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingOfferFormData {
  type: ShippingType;
  fromCity: string;
  toCity: string;
  departureDate: string;
  capacity: string;
  price: string;
  description: string;
}
