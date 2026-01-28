-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('guest', 'user', 'support', 'admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'banned');

-- CreateEnum
CREATE TYPE "TrustLevel" AS ENUM ('newcomer', 'trusted', 'verified', 'expert');

-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('fx', 'shipping');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('active', 'paused', 'expired', 'completed');

-- CreateEnum
CREATE TYPE "RateType" AS ENUM ('fixed', 'negotiable');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('pending', 'accepted', 'declined', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled', 'disputed');

-- CreateEnum
CREATE TYPE "ConfirmationType" AS ENUM ('sent', 'received');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'document', 'system');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('sent', 'delivered', 'seen');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('session_request', 'session_accepted', 'session_declined', 'session_cancelled', 'confirmation_received', 'session_completed', 'new_message', 'rating_received', 'offer_expired');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('push', 'email', 'in_app');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_guest" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "display_name" VARCHAR(50) NOT NULL,
    "avatar_url" TEXT,
    "bio" VARCHAR(500),
    "preferred_currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "language" VARCHAR(5) NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "location_city" TEXT,
    "location_country" VARCHAR(2),
    "is_kyc_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "total_exchanges" INTEGER NOT NULL DEFAULT 0,
    "successful_exchanges" INTEGER NOT NULL DEFAULT 0,
    "total_ratings" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "badges" JSONB NOT NULL DEFAULT '[]',
    "level" "TrustLevel" NOT NULL DEFAULT 'newcomer',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trust_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "OfferType" NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'active',
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000),
    "location_city" TEXT NOT NULL,
    "location_country" VARCHAR(2) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "source_currency" VARCHAR(3),
    "target_currency" VARCHAR(3),
    "source_amount" DECIMAL(15,2),
    "rate" DECIMAL(10,6),
    "min_amount" DECIMAL(15,2),
    "max_amount" DECIMAL(15,2),
    "rate_type" "RateType",
    "payment_methods" JSONB DEFAULT '[]',
    "origin_city" TEXT,
    "origin_country" VARCHAR(2),
    "destination_city" TEXT,
    "destination_country" VARCHAR(2),
    "departure_date" DATE,
    "arrival_date" DATE,
    "max_weight_kg" DECIMAL(5,2),
    "price_per_kg" DECIMAL(10,2),
    "accepted_items" JSONB DEFAULT '[]',
    "restricted_items" JSONB DEFAULT '[]',

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_sessions" (
    "id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "initiator_id" UUID NOT NULL,
    "responder_id" UUID NOT NULL,
    "type" "OfferType" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'pending',
    "agreed_terms" JSONB NOT NULL,
    "initiator_confirmed_at" TIMESTAMP(3),
    "responder_confirmed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by_id" UUID,
    "cancellation_reason" TEXT,
    "dispute_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_confirmations" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "ConfirmationType" NOT NULL,
    "confirmed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidence_url" TEXT,
    "notes" VARCHAR(500),

    CONSTRAINT "exchange_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "participant_ids" UUID[],
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'text',
    "status" "MessageStatus" NOT NULL DEFAULT 'sent',
    "metadata" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "rater_id" UUID NOT NULL,
    "ratee_id" UUID NOT NULL,
    "score" SMALLINT NOT NULL,
    "comment" VARCHAR(500),
    "tags" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "data" JSONB,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'in_app',
    "read_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "profiles_location_country_location_city_idx" ON "profiles"("location_country", "location_city");

-- CreateIndex
CREATE UNIQUE INDEX "trust_profiles_user_id_key" ON "trust_profiles"("user_id");

-- CreateIndex
CREATE INDEX "offers_user_id_idx" ON "offers"("user_id");

-- CreateIndex
CREATE INDEX "offers_status_idx" ON "offers"("status");

-- CreateIndex
CREATE INDEX "offers_type_status_idx" ON "offers"("type", "status");

-- CreateIndex
CREATE INDEX "offers_location_country_location_city_status_idx" ON "offers"("location_country", "location_city", "status");

-- CreateIndex
CREATE INDEX "offers_source_currency_target_currency_idx" ON "offers"("source_currency", "target_currency");

-- CreateIndex
CREATE INDEX "offers_origin_country_destination_country_idx" ON "offers"("origin_country", "destination_country");

-- CreateIndex
CREATE INDEX "offers_departure_date_idx" ON "offers"("departure_date");

-- CreateIndex
CREATE INDEX "offers_created_at_idx" ON "offers"("created_at");

-- CreateIndex
CREATE INDEX "exchange_sessions_offer_id_idx" ON "exchange_sessions"("offer_id");

-- CreateIndex
CREATE INDEX "exchange_sessions_initiator_id_idx" ON "exchange_sessions"("initiator_id");

-- CreateIndex
CREATE INDEX "exchange_sessions_responder_id_idx" ON "exchange_sessions"("responder_id");

-- CreateIndex
CREATE INDEX "exchange_sessions_status_idx" ON "exchange_sessions"("status");

-- CreateIndex
CREATE INDEX "exchange_sessions_initiator_id_responder_id_idx" ON "exchange_sessions"("initiator_id", "responder_id");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_confirmations_session_id_user_id_key" ON "exchange_confirmations"("session_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_session_id_key" ON "conversations"("session_id");

-- CreateIndex
CREATE INDEX "conversations_last_message_at_idx" ON "conversations"("last_message_at");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ratings_ratee_id_idx" ON "ratings"("ratee_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_session_id_rater_id_key" ON "ratings"("session_id", "rater_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");

-- CreateIndex
CREATE INDEX "push_tokens_user_id_idx" ON "push_tokens"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_profiles" ADD CONSTRAINT "trust_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_sessions" ADD CONSTRAINT "exchange_sessions_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_sessions" ADD CONSTRAINT "exchange_sessions_initiator_id_fkey" FOREIGN KEY ("initiator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_sessions" ADD CONSTRAINT "exchange_sessions_responder_id_fkey" FOREIGN KEY ("responder_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_sessions" ADD CONSTRAINT "exchange_sessions_cancelled_by_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_confirmations" ADD CONSTRAINT "exchange_confirmations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "exchange_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_confirmations" ADD CONSTRAINT "exchange_confirmations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "exchange_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "exchange_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rater_id_fkey" FOREIGN KEY ("rater_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ratee_id_fkey" FOREIGN KEY ("ratee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
