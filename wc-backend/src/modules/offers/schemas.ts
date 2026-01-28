import { z } from 'zod';
import { paginationSchema } from '../../shared/pagination.js';

// Base offer fields
const baseOfferSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  locationCity: z.string().min(1),
  locationCountry: z.string().length(2),
  expiresAt: z.string().datetime().optional(),
});

// FX-specific fields
const fxOfferSchema = z.object({
  type: z.literal('fx'),
  sourceCurrency: z.string().length(3),
  targetCurrency: z.string().length(3),
  sourceAmount: z.number().positive(),
  rate: z.number().positive().optional(), // Rate is optional for negotiable offers
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  rateType: z.enum(['fixed', 'negotiable']),
  paymentMethods: z.array(z.string()).optional(),
});

// Shipping-specific fields
const shippingOfferSchema = z.object({
  type: z.literal('shipping'),
  originCity: z.string().min(1),
  originCountry: z.string().length(2),
  destinationCity: z.string().min(1),
  destinationCountry: z.string().length(2),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  arrivalDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  maxWeightKg: z.number().positive(),
  pricePerKg: z.number().positive(),
  acceptedItems: z.array(z.string()).optional(),
  restrictedItems: z.array(z.string()).optional(),
});

// Create offer (discriminated union)
export const createOfferSchema = z.discriminatedUnion('type', [
  baseOfferSchema.merge(fxOfferSchema),
  baseOfferSchema.merge(shippingOfferSchema),
]);

export type CreateOfferInput = z.infer<typeof createOfferSchema>;

// Update offer
export const updateOfferSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['active', 'paused']).optional(),
  locationCity: z.string().optional(),
  locationCountry: z.string().length(2).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  // FX fields
  sourceAmount: z.number().positive().optional(),
  rate: z.number().positive().optional(),
  minAmount: z.number().positive().nullable().optional(),
  maxAmount: z.number().positive().nullable().optional(),
  rateType: z.enum(['fixed', 'negotiable']).optional(),
  paymentMethods: z.array(z.string()).optional(),
  // Shipping fields
  departureDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  arrivalDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  maxWeightKg: z.number().positive().optional(),
  pricePerKg: z.number().positive().optional(),
  acceptedItems: z.array(z.string()).optional(),
  restrictedItems: z.array(z.string()).optional(),
});

export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;

// Query filters
export const offerFiltersSchema = paginationSchema.extend({
  type: z.enum(['fx', 'shipping']).optional(),
  status: z.enum(['active', 'paused', 'expired', 'completed']).optional(),
  sourceCurrency: z.string().length(3).optional(),
  targetCurrency: z.string().length(3).optional(),
  originCountry: z.string().length(2).optional(),
  destinationCountry: z.string().length(2).optional(),
  locationCountry: z.string().length(2).optional(),
  locationCity: z.string().optional(),
  minAmount: z.string().transform(Number).optional(),
  maxAmount: z.string().transform(Number).optional(),
  sortBy: z.enum(['createdAt', 'rate', 'sourceAmount', 'pricePerKg']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type OfferFiltersInput = z.infer<typeof offerFiltersSchema>;

// Params
export const offerIdParamSchema = z.object({
  id: z.string().uuid(),
});
