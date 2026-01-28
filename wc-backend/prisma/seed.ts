/**
 * WontanConnect Database Seed
 *
 * Creates a realistic dataset for development and testing:
 * - 6 users with different profiles and trust levels
 * - 10 FX offers across multiple currency pairs and locations
 * - 6 shipping offers with various routes
 * - Exchange sessions in different states
 * - Conversations with message history
 * - Ratings and notifications
 *
 * Test Credentials:
 * - alice@wontanconnect.com / Test1234! (verified, Paris)
 * - bob@wontanconnect.com / Test1234! (trusted, Istanbul)
 * - charlie@wontanconnect.com / Test1234! (newcomer, Lyon)
 * - diana@wontanconnect.com / Test1234! (expert, Marseille)
 * - eric@wontanconnect.com / Test1234! (trusted, Ankara)
 * - admin@wontanconnect.com / Admin1234! (admin)
 */

import { PrismaClient, OfferType, SessionStatus, TrustLevel, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// HELPER FUNCTIONS
// ============================================

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// ============================================
// SEED DATA
// ============================================

async function main() {
  console.log('🌱 WontanConnect Database Seeding\n');
  console.log('═'.repeat(50));

  // ----------------------------------------
  // CLEANUP
  // ----------------------------------------
  console.log('\n🧹 Cleaning existing data...');

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.pushToken.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.rating.deleteMany(),
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.exchangeConfirmation.deleteMany(),
    prisma.exchangeSession.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.trustProfile.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('   ✓ Database cleaned');

  // ----------------------------------------
  // USERS
  // ----------------------------------------
  console.log('\n👤 Creating users...');

  const passwordHash = await bcrypt.hash('Test1234!', 12);
  const adminPasswordHash = await bcrypt.hash('Admin1234!', 12);

  // User 1: Alice - Verified user in Paris
  const alice = await prisma.user.create({
    data: {
      email: 'alice@wontanconnect.com',
      phone: '+33612345678',
      passwordHash,
      role: UserRole.user,
      emailVerified: true,
      phoneVerified: true,
      lastLoginAt: daysAgo(1),
      profile: {
        create: {
          displayName: 'Alice Martin',
          bio: 'Voyageuse fréquente entre Paris et Istanbul. Échanges rapides et fiables.',
          preferredCurrency: 'EUR',
          language: 'fr',
          timezone: 'Europe/Paris',
          locationCity: 'Paris',
          locationCountry: 'FR',
          isKycVerified: true,
        },
      },
      trustProfile: {
        create: {
          level: TrustLevel.verified,
          trustScore: 82,
          totalExchanges: 24,
          successfulExchanges: 22,
          totalRatings: 18,
          averageRating: 4.7,
          badges: ['early_adopter', 'fx_specialist', 'quick_responder'],
        },
      },
    },
  });

  // User 2: Bob - Trusted user in Istanbul
  const bob = await prisma.user.create({
    data: {
      email: 'bob@wontanconnect.com',
      phone: '+905551234567',
      passwordHash,
      role: UserRole.user,
      emailVerified: true,
      phoneVerified: true,
      lastLoginAt: daysAgo(0),
      profile: {
        create: {
          displayName: 'Bob Yılmaz',
          bio: 'Istanbul local. Best rates in Kadıköy and Beşiktaş areas. Available daily.',
          preferredCurrency: 'TRY',
          language: 'tr',
          timezone: 'Europe/Istanbul',
          locationCity: 'Istanbul',
          locationCountry: 'TR',
          isKycVerified: true,
        },
      },
      trustProfile: {
        create: {
          level: TrustLevel.trusted,
          trustScore: 68,
          totalExchanges: 45,
          successfulExchanges: 41,
          totalRatings: 35,
          averageRating: 4.5,
          badges: ['high_volume', 'local_expert'],
        },
      },
    },
  });

  // User 3: Charlie - Newcomer in Lyon
  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@wontanconnect.com',
      passwordHash,
      role: UserRole.user,
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Charlie Dupont',
          bio: 'Nouveau sur la plateforme. Étudiant à Lyon.',
          preferredCurrency: 'EUR',
          language: 'fr',
          timezone: 'Europe/Paris',
          locationCity: 'Lyon',
          locationCountry: 'FR',
        },
      },
      trustProfile: {
        create: {
          level: TrustLevel.newcomer,
          trustScore: 15,
          totalExchanges: 2,
          successfulExchanges: 2,
          totalRatings: 1,
          averageRating: 4.0,
          badges: [],
        },
      },
    },
  });

  // User 4: Diana - Expert in Marseille (shipping specialist)
  const diana = await prisma.user.create({
    data: {
      email: 'diana@wontanconnect.com',
      phone: '+33698765432',
      passwordHash,
      role: UserRole.user,
      emailVerified: true,
      phoneVerified: true,
      lastLoginAt: daysAgo(2),
      profile: {
        create: {
          displayName: 'Diana Kaya',
          avatarUrl: 'https://storage.wontanconnect.com/avatars/diana.jpg',
          bio: 'Franco-turque. Voyages réguliers Marseille-Istanbul-Ankara. Spécialiste transport de colis.',
          preferredCurrency: 'EUR',
          language: 'fr',
          timezone: 'Europe/Paris',
          locationCity: 'Marseille',
          locationCountry: 'FR',
          isKycVerified: true,
        },
      },
      trustProfile: {
        create: {
          level: TrustLevel.expert,
          trustScore: 95,
          totalExchanges: 87,
          successfulExchanges: 85,
          totalRatings: 72,
          averageRating: 4.9,
          badges: ['expert_trader', 'shipping_master', 'top_rated', 'verified_id'],
        },
      },
    },
  });

  // User 5: Eric - Trusted user in Ankara
  const eric = await prisma.user.create({
    data: {
      email: 'eric@wontanconnect.com',
      phone: '+905329876543',
      passwordHash,
      role: UserRole.user,
      emailVerified: true,
      lastLoginAt: daysAgo(5),
      profile: {
        create: {
          displayName: 'Eric Demir',
          bio: 'Based in Ankara. Weekly trips to European capitals.',
          preferredCurrency: 'TRY',
          language: 'en',
          timezone: 'Europe/Istanbul',
          locationCity: 'Ankara',
          locationCountry: 'TR',
        },
      },
      trustProfile: {
        create: {
          level: TrustLevel.trusted,
          trustScore: 58,
          totalExchanges: 18,
          successfulExchanges: 16,
          totalRatings: 12,
          averageRating: 4.3,
          badges: ['reliable'],
        },
      },
    },
  });

  // User 6: Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@wontanconnect.com',
      passwordHash: adminPasswordHash,
      role: UserRole.admin,
      emailVerified: true,
      profile: {
        create: {
          displayName: 'WontanConnect Admin',
          preferredCurrency: 'EUR',
          language: 'en',
        },
      },
      trustProfile: {
        create: {
          level: TrustLevel.expert,
          trustScore: 100,
        },
      },
    },
  });

  console.log('   ✓ Created 6 users');
  console.log(`     - Alice (verified): ${alice.id}`);
  console.log(`     - Bob (trusted): ${bob.id}`);
  console.log(`     - Charlie (newcomer): ${charlie.id}`);
  console.log(`     - Diana (expert): ${diana.id}`);
  console.log(`     - Eric (trusted): ${eric.id}`);
  console.log(`     - Admin: ${admin.id}`);

  // ----------------------------------------
  // FX OFFERS
  // ----------------------------------------
  console.log('\n💱 Creating FX offers...');

  const fxOffers = await Promise.all([
    // Alice's offers
    prisma.offer.create({
      data: {
        userId: alice.id,
        type: OfferType.fx,
        status: 'active',
        title: 'EUR → TRY | Paris Centre',
        description:
          'Échange Euros contre Livres Turques à Paris. Disponible en semaine 10h-18h près de Châtelet. Taux négociable pour gros montants.',
        locationCity: 'Paris',
        locationCountry: 'FR',
        sourceCurrency: 'EUR',
        targetCurrency: 'TRY',
        sourceAmount: 2000,
        rate: 35.5,
        minAmount: 100,
        maxAmount: 2000,
        rateType: 'negotiable',
        paymentMethods: ['cash', 'bank_transfer'],
        expiresAt: daysFromNow(30),
        viewCount: 45,
      },
    }),
    prisma.offer.create({
      data: {
        userId: alice.id,
        type: OfferType.fx,
        status: 'active',
        title: 'USD → EUR | Paris 16ème',
        description: 'Dollars américains contre Euros. Quartier Trocadéro uniquement.',
        locationCity: 'Paris',
        locationCountry: 'FR',
        sourceCurrency: 'USD',
        targetCurrency: 'EUR',
        sourceAmount: 1500,
        rate: 0.92,
        minAmount: 200,
        maxAmount: 1500,
        rateType: 'fixed',
        paymentMethods: ['cash'],
        expiresAt: daysFromNow(14),
        viewCount: 23,
      },
    }),

    // Bob's offers
    prisma.offer.create({
      data: {
        userId: bob.id,
        type: OfferType.fx,
        status: 'active',
        title: 'TRY → EUR | Kadıköy',
        description:
          "En iyi kurlar Kadıköy'de! Nakit veya banka transferi kabul edilir. Her gün müsaitim.",
        locationCity: 'Istanbul',
        locationCountry: 'TR',
        sourceCurrency: 'TRY',
        targetCurrency: 'EUR',
        sourceAmount: 50000,
        rate: 0.028,
        minAmount: 5000,
        maxAmount: 50000,
        rateType: 'negotiable',
        paymentMethods: ['cash', 'bank_transfer', 'papara'],
        viewCount: 89,
      },
    }),
    prisma.offer.create({
      data: {
        userId: bob.id,
        type: OfferType.fx,
        status: 'active',
        title: 'USD → TRY | Istanbul Airport',
        description: 'Available at Istanbul Airport arrivals. Quick exchange for travelers.',
        locationCity: 'Istanbul',
        locationCountry: 'TR',
        sourceCurrency: 'USD',
        targetCurrency: 'TRY',
        sourceAmount: 5000,
        rate: 32.8,
        minAmount: 100,
        maxAmount: 5000,
        rateType: 'fixed',
        paymentMethods: ['cash'],
        expiresAt: daysFromNow(60),
        viewCount: 156,
      },
    }),
    prisma.offer.create({
      data: {
        userId: bob.id,
        type: OfferType.fx,
        status: 'paused',
        title: 'GBP → TRY | Beşiktaş',
        description: 'British Pounds to Turkish Lira. Currently paused - back next week.',
        locationCity: 'Istanbul',
        locationCountry: 'TR',
        sourceCurrency: 'GBP',
        targetCurrency: 'TRY',
        sourceAmount: 3000,
        rate: 41.5,
        rateType: 'negotiable',
        paymentMethods: ['cash'],
        viewCount: 34,
      },
    }),

    // Diana's offers
    prisma.offer.create({
      data: {
        userId: diana.id,
        type: OfferType.fx,
        status: 'active',
        title: 'EUR → TRY | Marseille Vieux-Port',
        description: 'Meilleurs taux à Marseille. RDV au Vieux-Port. Gros volumes acceptés.',
        locationCity: 'Marseille',
        locationCountry: 'FR',
        sourceCurrency: 'EUR',
        targetCurrency: 'TRY',
        sourceAmount: 5000,
        rate: 35.8,
        minAmount: 500,
        maxAmount: 5000,
        rateType: 'negotiable',
        paymentMethods: ['cash', 'bank_transfer'],
        expiresAt: daysFromNow(45),
        viewCount: 67,
      },
    }),

    // Eric's offers
    prisma.offer.create({
      data: {
        userId: eric.id,
        type: OfferType.fx,
        status: 'active',
        title: 'TRY → EUR | Ankara Kızılay',
        description: 'Exchange in central Ankara. Meeting at Kızılay metro station.',
        locationCity: 'Ankara',
        locationCountry: 'TR',
        sourceCurrency: 'TRY',
        targetCurrency: 'EUR',
        sourceAmount: 30000,
        rate: 0.0275,
        minAmount: 3000,
        maxAmount: 30000,
        rateType: 'fixed',
        paymentMethods: ['cash'],
        viewCount: 28,
      },
    }),

    // Charlie's first offer (newcomer)
    prisma.offer.create({
      data: {
        userId: charlie.id,
        type: OfferType.fx,
        status: 'active',
        title: 'EUR → USD | Lyon Part-Dieu',
        description: 'Premier échange sur la plateforme. Petits montants uniquement.',
        locationCity: 'Lyon',
        locationCountry: 'FR',
        sourceCurrency: 'EUR',
        targetCurrency: 'USD',
        sourceAmount: 300,
        rate: 1.08,
        minAmount: 50,
        maxAmount: 300,
        rateType: 'fixed',
        paymentMethods: ['cash'],
        expiresAt: daysFromNow(7),
        viewCount: 5,
      },
    }),

    // Expired offer
    prisma.offer.create({
      data: {
        userId: alice.id,
        type: OfferType.fx,
        status: 'expired',
        title: 'CHF → EUR | Paris (Expired)',
        description: 'Cette offre a expiré.',
        locationCity: 'Paris',
        locationCountry: 'FR',
        sourceCurrency: 'CHF',
        targetCurrency: 'EUR',
        sourceAmount: 1000,
        rate: 1.05,
        rateType: 'fixed',
        paymentMethods: ['cash'],
        expiresAt: daysAgo(5),
        viewCount: 12,
      },
    }),
  ]);

  console.log(`   ✓ Created ${fxOffers.length} FX offers`);

  // ----------------------------------------
  // SHIPPING OFFERS
  // ----------------------------------------
  console.log('\n📦 Creating shipping offers...');

  const shippingOffers = await Promise.all([
    // Diana's shipping offers (specialist)
    prisma.offer.create({
      data: {
        userId: diana.id,
        type: OfferType.shipping,
        status: 'active',
        title: 'Marseille → Istanbul | 28 Jan',
        description:
          'Vol direct Marseille-Istanbul. Capacité 8kg. Documents, vêtements, électronique acceptés. Livraison à domicile possible côté Istanbul.',
        locationCity: 'Marseille',
        locationCountry: 'FR',
        originCity: 'Marseille',
        originCountry: 'FR',
        destinationCity: 'Istanbul',
        destinationCountry: 'TR',
        departureDate: daysFromNow(7),
        arrivalDate: daysFromNow(7),
        maxWeightKg: 8,
        pricePerKg: 20,
        acceptedItems: ['documents', 'clothing', 'electronics', 'cosmetics', 'books'],
        restrictedItems: [
          'liquids_over_100ml',
          'batteries_loose',
          'food',
          'valuables_over_1000eur',
        ],
        viewCount: 42,
      },
    }),
    prisma.offer.create({
      data: {
        userId: diana.id,
        type: OfferType.shipping,
        status: 'active',
        title: 'Istanbul → Marseille | 05 Feb',
        description:
          'Retour Istanbul-Marseille. 10kg disponibles. Récupération possible à Kadıköy ou Taksim.',
        locationCity: 'Istanbul',
        locationCountry: 'TR',
        originCity: 'Istanbul',
        originCountry: 'TR',
        destinationCity: 'Marseille',
        destinationCountry: 'FR',
        departureDate: daysFromNow(15),
        arrivalDate: daysFromNow(15),
        maxWeightKg: 10,
        pricePerKg: 18,
        acceptedItems: ['documents', 'clothing', 'spices', 'gifts', 'electronics'],
        restrictedItems: ['liquids', 'perishables'],
        viewCount: 38,
      },
    }),
    prisma.offer.create({
      data: {
        userId: diana.id,
        type: OfferType.shipping,
        status: 'active',
        title: 'Marseille → Ankara | 10 Feb',
        description: 'Via Istanbul avec escale. Colis récupérés 48h avant départ.',
        locationCity: 'Marseille',
        locationCountry: 'FR',
        originCity: 'Marseille',
        originCountry: 'FR',
        destinationCity: 'Ankara',
        destinationCountry: 'TR',
        departureDate: daysFromNow(20),
        arrivalDate: daysFromNow(21),
        maxWeightKg: 5,
        pricePerKg: 25,
        acceptedItems: ['documents', 'small_electronics', 'clothing'],
        restrictedItems: ['fragile', 'liquids'],
        viewCount: 15,
      },
    }),

    // Alice's shipping offer
    prisma.offer.create({
      data: {
        userId: alice.id,
        type: OfferType.shipping,
        status: 'active',
        title: 'Paris → Istanbul | 02 Feb',
        description:
          "Voyage d'affaires Paris-Istanbul. 5kg disponibles pour documents et petits colis.",
        locationCity: 'Paris',
        locationCountry: 'FR',
        originCity: 'Paris',
        originCountry: 'FR',
        destinationCity: 'Istanbul',
        destinationCountry: 'TR',
        departureDate: daysFromNow(12),
        arrivalDate: daysFromNow(12),
        maxWeightKg: 5,
        pricePerKg: 22,
        acceptedItems: ['documents', 'small_packages'],
        restrictedItems: ['liquids', 'food', 'fragile'],
        viewCount: 29,
      },
    }),

    // Eric's shipping offer
    prisma.offer.create({
      data: {
        userId: eric.id,
        type: OfferType.shipping,
        status: 'active',
        title: 'Ankara → Paris | 15 Feb',
        description: 'Monthly business trip. 7kg available. Pickup from Çankaya district.',
        locationCity: 'Ankara',
        locationCountry: 'TR',
        originCity: 'Ankara',
        originCountry: 'TR',
        destinationCity: 'Paris',
        destinationCountry: 'FR',
        departureDate: daysFromNow(25),
        arrivalDate: daysFromNow(25),
        maxWeightKg: 7,
        pricePerKg: 20,
        acceptedItems: ['documents', 'textiles', 'gifts'],
        restrictedItems: ['electronics', 'valuables'],
        viewCount: 18,
      },
    }),

    // Bob's shipping (expired)
    prisma.offer.create({
      data: {
        userId: bob.id,
        type: OfferType.shipping,
        status: 'expired',
        title: 'Istanbul → Lyon | 10 Jan (Passé)',
        description: 'Ce trajet est passé.',
        locationCity: 'Istanbul',
        locationCountry: 'TR',
        originCity: 'Istanbul',
        originCountry: 'TR',
        destinationCity: 'Lyon',
        destinationCountry: 'FR',
        departureDate: daysAgo(11),
        arrivalDate: daysAgo(11),
        maxWeightKg: 6,
        pricePerKg: 15,
        acceptedItems: ['all_legal'],
        restrictedItems: [],
        viewCount: 22,
      },
    }),
  ]);

  console.log(`   ✓ Created ${shippingOffers.length} shipping offers`);

  // ----------------------------------------
  // EXCHANGE SESSIONS
  // ----------------------------------------
  console.log('\n🤝 Creating exchange sessions...');

  // Session 1: Completed FX exchange (Bob initiated with Alice)
  const session1 = await prisma.exchangeSession.create({
    data: {
      offerId: fxOffers[0].id, // Alice's EUR→TRY offer
      initiatorId: bob.id,
      responderId: alice.id,
      type: OfferType.fx,
      status: SessionStatus.completed,
      agreedTerms: {
        sourceCurrency: 'EUR',
        targetCurrency: 'TRY',
        amount: 500,
        rate: 35.5,
        totalTarget: 17750,
        meetingLocation: 'Café des Arts, Châtelet, Paris',
        meetingTime: daysAgo(10).toISOString(),
        paymentMethod: 'cash',
      },
      initiatorConfirmedAt: daysAgo(10),
      responderConfirmedAt: daysAgo(10),
      completedAt: daysAgo(10),
    },
  });

  // Session 2: Completed shipping (Charlie used Diana's service)
  const session2 = await prisma.exchangeSession.create({
    data: {
      offerId: shippingOffers[5].id, // Bob's expired Istanbul→Lyon
      initiatorId: charlie.id,
      responderId: bob.id,
      type: OfferType.shipping,
      status: SessionStatus.completed,
      agreedTerms: {
        originCity: 'Istanbul',
        destinationCity: 'Lyon',
        weightKg: 2.5,
        pricePerKg: 15,
        totalPrice: 37.5,
        itemDescription: 'Vêtements et souvenirs',
        pickupAddress: 'Kadıköy ferry terminal',
        deliveryAddress: 'Lyon Part-Dieu',
      },
      initiatorConfirmedAt: daysAgo(12),
      responderConfirmedAt: daysAgo(11),
      completedAt: daysAgo(11),
    },
  });

  // Session 3: Pending FX (Charlie wants to exchange with Bob)
  const session3 = await prisma.exchangeSession.create({
    data: {
      offerId: fxOffers[2].id, // Bob's TRY→EUR offer
      initiatorId: charlie.id,
      responderId: bob.id,
      type: OfferType.fx,
      status: SessionStatus.pending,
      agreedTerms: {
        sourceCurrency: 'TRY',
        targetCurrency: 'EUR',
        amount: 10000,
        rate: 0.028,
        totalTarget: 280,
        proposedMeetingLocation: 'Taksim Square',
        proposedTime: daysFromNow(3).toISOString(),
      },
    },
  });

  // Session 4: Accepted, in progress (Eric exchanging with Diana)
  const session4 = await prisma.exchangeSession.create({
    data: {
      offerId: fxOffers[5].id, // Diana's EUR→TRY Marseille
      initiatorId: eric.id,
      responderId: diana.id,
      type: OfferType.fx,
      status: SessionStatus.in_progress,
      agreedTerms: {
        sourceCurrency: 'EUR',
        targetCurrency: 'TRY',
        amount: 1000,
        rate: 35.8,
        totalTarget: 35800,
        meetingLocation: 'Vieux-Port, Marseille',
        meetingTime: daysFromNow(1).toISOString(),
        paymentMethod: 'cash',
      },
    },
  });

  // Session 5: Awaiting confirmation shipping
  const session5 = await prisma.exchangeSession.create({
    data: {
      offerId: shippingOffers[3].id, // Alice's Paris→Istanbul
      initiatorId: bob.id,
      responderId: alice.id,
      type: OfferType.shipping,
      status: SessionStatus.awaiting_confirmation,
      agreedTerms: {
        originCity: 'Paris',
        destinationCity: 'Istanbul',
        weightKg: 3,
        pricePerKg: 22,
        totalPrice: 66,
        itemDescription: 'Documents administratifs importants',
        pickupAddress: 'Paris 16ème',
        deliveryAddress: 'Beşiktaş, Istanbul',
      },
      initiatorConfirmedAt: daysAgo(1),
    },
  });

  // Session 6: Cancelled session
  const session6 = await prisma.exchangeSession.create({
    data: {
      offerId: fxOffers[3].id, // Bob's USD→TRY
      initiatorId: alice.id,
      responderId: bob.id,
      type: OfferType.fx,
      status: SessionStatus.cancelled,
      agreedTerms: {
        sourceCurrency: 'USD',
        targetCurrency: 'TRY',
        amount: 500,
        rate: 32.8,
        totalTarget: 16400,
      },
      cancelledAt: daysAgo(5),
      cancelledById: alice.id,
      cancellationReason: 'Changement de plans de voyage',
    },
  });

  // Session 7: Declined session
  const session7 = await prisma.exchangeSession.create({
    data: {
      offerId: fxOffers[6].id, // Eric's TRY→EUR
      initiatorId: charlie.id,
      responderId: eric.id,
      type: OfferType.fx,
      status: SessionStatus.declined,
      agreedTerms: {
        sourceCurrency: 'TRY',
        targetCurrency: 'EUR',
        amount: 5000,
        rate: 0.0275,
        proposedMeetingLocation: 'Ankara',
      },
    },
  });

  console.log('   ✓ Created 7 exchange sessions');
  console.log('     - 2 completed, 1 pending, 1 in_progress');
  console.log('     - 1 awaiting_confirmation, 1 cancelled, 1 declined');

  // ----------------------------------------
  // EXCHANGE CONFIRMATIONS
  // ----------------------------------------
  console.log('\n✅ Creating exchange confirmations...');

  await prisma.exchangeConfirmation.createMany({
    data: [
      // Session 1 confirmations (completed)
      {
        sessionId: session1.id,
        userId: bob.id,
        type: 'received',
        confirmedAt: daysAgo(10),
        notes: 'Échange parfait, merci Alice!',
      },
      {
        sessionId: session1.id,
        userId: alice.id,
        type: 'received',
        confirmedAt: daysAgo(10),
        notes: 'Transaction rapide et sans problème',
      },
      // Session 2 confirmations (completed shipping)
      {
        sessionId: session2.id,
        userId: charlie.id,
        type: 'received',
        confirmedAt: daysAgo(11),
        notes: 'Colis bien reçu en parfait état',
      },
      {
        sessionId: session2.id,
        userId: bob.id,
        type: 'sent',
        confirmedAt: daysAgo(12),
        evidenceUrl: 'https://storage.wontanconnect.com/confirmations/sess2-proof.jpg',
      },
      // Session 5 partial confirmation (awaiting)
      {
        sessionId: session5.id,
        userId: bob.id,
        type: 'sent',
        confirmedAt: daysAgo(1),
        notes: 'Documents remis à Alice',
      },
    ],
  });

  console.log('   ✓ Created 5 confirmations');

  // ----------------------------------------
  // CONVERSATIONS & MESSAGES
  // ----------------------------------------
  console.log('\n💬 Creating conversations and messages...');

  // Conversation 1: Session 1 (completed)
  const conv1 = await prisma.conversation.create({
    data: {
      sessionId: session1.id,
      participantIds: [alice.id, bob.id],
      lastMessageAt: daysAgo(10),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        senderId: bob.id,
        content:
          'Bonjour Alice! Je suis intéressé par votre offre EUR→TRY. Est-ce que 500€ vous convient?',
        type: 'text',
        status: 'seen',
        readAt: daysAgo(12),
        createdAt: daysAgo(12),
      },
      {
        conversationId: conv1.id,
        senderId: alice.id,
        content:
          "Bonjour Bob! Oui, 500€ c'est parfait. On peut se retrouver au Café des Arts près de Châtelet demain à 14h?",
        type: 'text',
        status: 'seen',
        readAt: daysAgo(12),
        createdAt: daysAgo(12),
      },
      {
        conversationId: conv1.id,
        senderId: bob.id,
        content: 'Parfait! À demain alors 👍',
        type: 'text',
        status: 'seen',
        readAt: daysAgo(11),
        createdAt: daysAgo(11),
      },
      {
        conversationId: conv1.id,
        senderId: alice.id,
        content: 'Je suis arrivée, je suis à la terrasse avec un sac bleu.',
        type: 'text',
        status: 'seen',
        readAt: daysAgo(10),
        createdAt: daysAgo(10),
      },
      {
        conversationId: conv1.id,
        senderId: bob.id,
        content: "J'arrive dans 2 minutes!",
        type: 'text',
        status: 'seen',
        readAt: daysAgo(10),
        createdAt: daysAgo(10),
      },
      {
        conversationId: conv1.id,
        senderId: bob.id,
        content: 'Échange terminé, merci beaucoup Alice! 🎉',
        type: 'text',
        status: 'seen',
        readAt: daysAgo(10),
        createdAt: daysAgo(10),
      },
    ],
  });

  // Conversation 2: Session 3 (pending)
  const conv2 = await prisma.conversation.create({
    data: {
      sessionId: session3.id,
      participantIds: [charlie.id, bob.id],
      lastMessageAt: daysAgo(1),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv2.id,
        senderId: charlie.id,
        content: 'Merhaba Bob! I would like to exchange 10,000 TRY. Is your offer still available?',
        type: 'text',
        status: 'seen',
        readAt: daysAgo(2),
        createdAt: daysAgo(2),
      },
      {
        conversationId: conv2.id,
        senderId: bob.id,
        content: 'Hi Charlie! Yes, still available. When are you planning to come to Istanbul?',
        type: 'text',
        status: 'seen',
        readAt: daysAgo(2),
        createdAt: daysAgo(2),
      },
      {
        conversationId: conv2.id,
        senderId: charlie.id,
        content: "I'll be there in 3 days. Can we meet at Taksim Square?",
        type: 'text',
        status: 'delivered',
        createdAt: daysAgo(1),
      },
    ],
  });

  // Conversation 3: Session 4 (in progress)
  const conv3 = await prisma.conversation.create({
    data: {
      sessionId: session4.id,
      participantIds: [eric.id, diana.id],
      lastMessageAt: daysAgo(0),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv3.id,
        senderId: eric.id,
        content:
          "Bonjour Diana, j'ai vu votre offre à Marseille. Je serai là demain, on peut faire l'échange?",
        type: 'text',
        status: 'seen',
        readAt: daysAgo(3),
        createdAt: daysAgo(3),
      },
      {
        conversationId: conv3.id,
        senderId: diana.id,
        content:
          'Bonjour Eric! Bienvenue à Marseille. Oui bien sûr, retrouvons-nous au Vieux-Port demain à 11h.',
        type: 'text',
        status: 'seen',
        readAt: daysAgo(2),
        createdAt: daysAgo(2),
      },
      {
        conversationId: conv3.id,
        senderId: eric.id,
        content: 'Parfait! Je viendrai avec 1000€. À demain!',
        type: 'text',
        status: 'seen',
        readAt: daysAgo(1),
        createdAt: daysAgo(1),
      },
      {
        conversationId: conv3.id,
        senderId: diana.id,
        content: 'À demain! Je serai près de la grande roue.',
        type: 'text',
        status: 'delivered',
        createdAt: daysAgo(0),
      },
    ],
  });

  // Conversation 4: Session 5 (awaiting confirmation)
  const conv4 = await prisma.conversation.create({
    data: {
      sessionId: session5.id,
      participantIds: [bob.id, alice.id],
      lastMessageAt: daysAgo(1),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv4.id,
        senderId: bob.id,
        content: "Alice, j'ai des documents importants à envoyer à Istanbul. Tu peux les prendre?",
        type: 'text',
        status: 'seen',
        readAt: daysAgo(4),
        createdAt: daysAgo(4),
      },
      {
        conversationId: conv4.id,
        senderId: alice.id,
        content:
          "Bien sûr Bob! Apporte-les moi demain et je les livrerai à l'adresse que tu me donnes.",
        type: 'text',
        status: 'seen',
        readAt: daysAgo(3),
        createdAt: daysAgo(3),
      },
      {
        conversationId: conv4.id,
        senderId: bob.id,
        content: 'Documents remis! Merci Alice, tu peux confirmer la réception?',
        type: 'text',
        status: 'seen',
        readAt: daysAgo(1),
        createdAt: daysAgo(1),
      },
      {
        conversationId: conv4.id,
        senderId: alice.id,
        content: 'Reçus! Je pars demain matin, je te tiens au courant de la livraison.',
        type: 'text',
        status: 'sent',
        createdAt: daysAgo(1),
      },
    ],
  });

  console.log('   ✓ Created 4 conversations with 17 messages');

  // ----------------------------------------
  // RATINGS
  // ----------------------------------------
  console.log('\n⭐ Creating ratings...');

  await prisma.rating.createMany({
    data: [
      // Ratings for session 1
      {
        sessionId: session1.id,
        raterId: bob.id,
        rateeId: alice.id,
        score: 5,
        comment:
          'Excellent échange avec Alice! Très professionnelle, ponctuelle et sympathique. Je recommande vivement.',
        tags: ['punctual', 'professional', 'friendly', 'good_rate'],
        createdAt: daysAgo(10),
      },
      {
        sessionId: session1.id,
        raterId: alice.id,
        rateeId: bob.id,
        score: 5,
        comment:
          "Bob est un partenaire d'échange idéal. Communication claire et transaction rapide.",
        tags: ['reliable', 'good_communication', 'quick'],
        createdAt: daysAgo(10),
      },
      // Ratings for session 2
      {
        sessionId: session2.id,
        raterId: charlie.id,
        rateeId: bob.id,
        score: 4,
        comment: 'Bon service de transport. Colis arrivé en bon état avec un léger retard.',
        tags: ['reliable', 'careful'],
        createdAt: daysAgo(11),
      },
      {
        sessionId: session2.id,
        raterId: bob.id,
        rateeId: charlie.id,
        score: 4,
        comment: 'Charlie was easy to work with. Pickup was smooth.',
        tags: ['punctual', 'friendly'],
        createdAt: daysAgo(11),
      },
    ],
  });

  console.log('   ✓ Created 4 ratings');

  // ----------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------
  console.log('\n🔔 Creating notifications...');

  await prisma.notification.createMany({
    data: [
      // Charlie's notifications
      {
        userId: charlie.id,
        type: 'session_request',
        title: 'Demande en attente',
        body: "Votre demande d'échange avec Bob est en attente de confirmation",
        data: { sessionId: session3.id },
        channel: 'in_app',
        createdAt: daysAgo(2),
      },
      // Bob's notifications
      {
        userId: bob.id,
        type: 'session_request',
        title: 'Nouvelle demande',
        body: 'Charlie souhaite échanger 10,000 TRY avec vous',
        data: { sessionId: session3.id },
        channel: 'in_app',
        sentAt: daysAgo(2),
        createdAt: daysAgo(2),
      },
      {
        userId: bob.id,
        type: 'rating_received',
        title: 'Nouvel avis',
        body: 'Charlie vous a donné 4 étoiles ⭐⭐⭐⭐',
        data: { ratingScore: 4 },
        channel: 'push',
        readAt: daysAgo(10),
        sentAt: daysAgo(11),
        createdAt: daysAgo(11),
      },
      // Diana's notifications
      {
        userId: diana.id,
        type: 'session_accepted',
        title: 'Échange confirmé',
        body: "Eric a accepté vos termes pour l'échange de 1000€",
        data: { sessionId: session4.id },
        channel: 'in_app',
        readAt: daysAgo(2),
        sentAt: daysAgo(2),
        createdAt: daysAgo(2),
      },
      // Alice's notifications
      {
        userId: alice.id,
        type: 'rating_received',
        title: 'Nouvel avis reçu',
        body: 'Bob vous a donné 5 étoiles ⭐⭐⭐⭐⭐',
        data: { ratingScore: 5, comment: 'Excellent échange avec Alice!' },
        channel: 'push',
        readAt: daysAgo(9),
        sentAt: daysAgo(10),
        createdAt: daysAgo(10),
      },
      {
        userId: alice.id,
        type: 'confirmation_received',
        title: 'Confirmation reçue',
        body: 'Bob a confirmé avoir remis les documents',
        data: { sessionId: session5.id },
        channel: 'in_app',
        sentAt: daysAgo(1),
        createdAt: daysAgo(1),
      },
      // Eric's notifications
      {
        userId: eric.id,
        type: 'new_message',
        title: 'Nouveau message',
        body: 'Diana: À demain! Je serai près de la grande roue.',
        data: { conversationId: conv3.id },
        channel: 'push',
        sentAt: daysAgo(0),
        createdAt: daysAgo(0),
      },
      {
        userId: eric.id,
        type: 'session_declined',
        title: 'Demande refusée',
        body: "Votre demande d'échange avec Eric D. n'a pas été acceptée",
        data: { sessionId: session7.id },
        channel: 'in_app',
        createdAt: daysAgo(8),
      },
    ],
  });

  console.log('   ✓ Created 8 notifications');

  // ----------------------------------------
  // PUSH TOKENS
  // ----------------------------------------
  console.log('\n📱 Creating push tokens...');

  await prisma.pushToken.createMany({
    data: [
      {
        userId: alice.id,
        token: 'ExponentPushToken[alice-device-token-123]',
        platform: 'ios',
      },
      {
        userId: bob.id,
        token: 'ExponentPushToken[bob-device-token-456]',
        platform: 'android',
      },
      {
        userId: diana.id,
        token: 'ExponentPushToken[diana-device-token-789]',
        platform: 'ios',
      },
      {
        userId: eric.id,
        token: 'ExponentPushToken[eric-device-token-012]',
        platform: 'android',
      },
    ],
  });

  console.log('   ✓ Created 4 push tokens');

  // ----------------------------------------
  // AUDIT LOGS
  // ----------------------------------------
  console.log('\n📋 Creating audit logs...');

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: alice.id,
        action: 'user.login',
        entityType: 'User',
        entityId: alice.id,
        ipAddress: '192.168.1.100',
        userAgent: 'WontanConnect/1.0 (iOS 17.0)',
        timestamp: daysAgo(1),
      },
      {
        actorId: bob.id,
        action: 'offer.create',
        entityType: 'Offer',
        entityId: fxOffers[2].id,
        newValues: { type: 'fx', status: 'active' },
        ipAddress: '10.0.0.50',
        userAgent: 'WontanConnect/1.0 (Android 14)',
        timestamp: daysAgo(15),
      },
      {
        actorId: alice.id,
        action: 'session.complete',
        entityType: 'ExchangeSession',
        entityId: session1.id,
        oldValues: { status: 'in_progress' },
        newValues: { status: 'completed' },
        timestamp: daysAgo(10),
      },
      {
        actorId: admin.id,
        action: 'user.verify_kyc',
        entityType: 'Profile',
        entityId: alice.id,
        oldValues: { isKycVerified: false },
        newValues: { isKycVerified: true },
        metadata: { verificationMethod: 'document_scan', verifiedBy: 'admin' },
        timestamp: daysAgo(30),
      },
    ],
  });

  console.log('   ✓ Created 4 audit logs');

  // ----------------------------------------
  // SUMMARY
  // ----------------------------------------
  console.log('\n' + '═'.repeat(50));
  console.log('✅ SEED COMPLETED SUCCESSFULLY\n');
  console.log('📊 Database Statistics:');
  console.log('   • Users: 6 (1 admin, 5 regular)');
  console.log('   • FX Offers: 10');
  console.log('   • Shipping Offers: 6');
  console.log('   • Exchange Sessions: 7');
  console.log('   • Confirmations: 5');
  console.log('   • Conversations: 4');
  console.log('   • Messages: 17');
  console.log('   • Ratings: 4');
  console.log('   • Notifications: 8');
  console.log('   • Push Tokens: 4');
  console.log('   • Audit Logs: 4');
  console.log('\n🔐 Test Credentials:');
  console.log('   ┌─────────────────────────────────┬─────────────┐');
  console.log('   │ Email                           │ Password    │');
  console.log('   ├─────────────────────────────────┼─────────────┤');
  console.log('   │ alice@wontanconnect.com         │ Test1234!   │');
  console.log('   │ bob@wontanconnect.com           │ Test1234!   │');
  console.log('   │ charlie@wontanconnect.com       │ Test1234!   │');
  console.log('   │ diana@wontanconnect.com         │ Test1234!   │');
  console.log('   │ eric@wontanconnect.com          │ Test1234!   │');
  console.log('   │ admin@wontanconnect.com         │ Admin1234!  │');
  console.log('   └─────────────────────────────────┴─────────────┘');
  console.log('═'.repeat(50) + '\n');
}

main()
  .catch((e) => {
    console.error('\n❌ SEED FAILED');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
