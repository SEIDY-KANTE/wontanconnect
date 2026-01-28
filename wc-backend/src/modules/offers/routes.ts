import { Router } from 'express';
import { offerController } from './controller.js';
import { validateBody, validateQuery, validateParams } from '../../middleware/validate.js';
import { authMiddleware, requireUser } from '../../middleware/auth.js';
import {
  createOfferSchema,
  updateOfferSchema,
  offerFiltersSchema,
  offerIdParamSchema,
} from './schemas.js';
import { paginationSchema } from '../../shared/pagination.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// List offers (with filters)
router.get(
  '/',
  validateQuery(offerFiltersSchema),
  offerController.listOffers.bind(offerController)
);

// Get my offers
router.get(
  '/my',
  validateQuery(paginationSchema),
  offerController.getMyOffers.bind(offerController)
);

// Create offer (requires non-guest)
router.post(
  '/',
  requireUser,
  validateBody(createOfferSchema),
  offerController.createOffer.bind(offerController)
);

// Get single offer
router.get(
  '/:id',
  validateParams(offerIdParamSchema),
  offerController.getOffer.bind(offerController)
);

// Update offer (requires non-guest + owner)
router.patch(
  '/:id',
  requireUser,
  validateParams(offerIdParamSchema),
  validateBody(updateOfferSchema),
  offerController.updateOffer.bind(offerController)
);

// Delete offer (requires non-guest + owner)
router.delete(
  '/:id',
  requireUser,
  validateParams(offerIdParamSchema),
  offerController.deleteOffer.bind(offerController)
);

export { router as offerRoutes };
