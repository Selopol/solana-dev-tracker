CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."token_status" AS ENUM('active', 'migrated', 'bonded', 'failed', 'rugged', 'abandoned');--> statement-breakpoint
CREATE TABLE "developers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "developers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"displayName" text,
	"primaryWallet" varchar(64) NOT NULL,
	"totalTokensLaunched" integer DEFAULT 0 NOT NULL,
	"migratedTokens" integer DEFAULT 0 NOT NULL,
	"bondedTokens" integer DEFAULT 0 NOT NULL,
	"failedTokens" integer DEFAULT 0 NOT NULL,
	"migrationSuccessRate" integer DEFAULT 0 NOT NULL,
	"reputationScore" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "developers_primaryWallet_unique" UNIQUE("primaryWallet")
);
--> statement-breakpoint
CREATE TABLE "migration_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "migration_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tokenId" integer NOT NULL,
	"fromPlatform" varchar(64) DEFAULT 'pump.fun' NOT NULL,
	"toPlatform" varchar(64),
	"transactionSignature" varchar(128) NOT NULL,
	"marketCapAtMigration" integer,
	"migratedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notification_preferences_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"developerId" integer,
	"notifyOnLaunch" integer DEFAULT 1 NOT NULL,
	"notifyOnMigration" integer DEFAULT 1 NOT NULL,
	"notifyOnSuspicious" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tokenAddress" varchar(64) NOT NULL,
	"developerId" integer NOT NULL,
	"name" text,
	"symbol" varchar(32),
	"status" "token_status" DEFAULT 'active' NOT NULL,
	"launchedAt" timestamp DEFAULT now() NOT NULL,
	"migratedAt" timestamp,
	"bondedAt" timestamp,
	"failedAt" timestamp,
	"initialMarketCap" integer,
	"peakMarketCap" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tokens_tokenAddress_unique" UNIQUE("tokenAddress")
);
--> statement-breakpoint
CREATE TABLE "twitter_linkages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "twitter_linkages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"developerId" integer,
	"tokenId" integer,
	"twitterHandle" varchar(64),
	"twitterUserId" varchar(64),
	"twitterCommunityId" varchar(64),
	"isAdmin" integer DEFAULT 0 NOT NULL,
	"verifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "wallet_associations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "wallet_associations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"developerId" integer NOT NULL,
	"walletAddress" varchar(64) NOT NULL,
	"confidence" integer DEFAULT 100 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_associations_walletAddress_unique" UNIQUE("walletAddress")
);
--> statement-breakpoint
ALTER TABLE "migration_events" ADD CONSTRAINT "migration_events_tokenId_tokens_id_fk" FOREIGN KEY ("tokenId") REFERENCES "public"."tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_developerId_developers_id_fk" FOREIGN KEY ("developerId") REFERENCES "public"."developers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_developerId_developers_id_fk" FOREIGN KEY ("developerId") REFERENCES "public"."developers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "twitter_linkages" ADD CONSTRAINT "twitter_linkages_developerId_developers_id_fk" FOREIGN KEY ("developerId") REFERENCES "public"."developers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "twitter_linkages" ADD CONSTRAINT "twitter_linkages_tokenId_tokens_id_fk" FOREIGN KEY ("tokenId") REFERENCES "public"."tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_associations" ADD CONSTRAINT "wallet_associations_developerId_developers_id_fk" FOREIGN KEY ("developerId") REFERENCES "public"."developers"("id") ON DELETE no action ON UPDATE no action;