import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Developer profiles table - stores aggregated information about token developers
 */
export const developers = mysqlTable("developers", {
  id: int("id").autoincrement().primaryKey(),
  /** Primary wallet address used to identify this developer */
  primaryWallet: varchar("primaryWallet", { length: 44 }).notNull().unique(),
  /** Display name for the developer (can be derived from Twitter or manual) */
  displayName: text("displayName"),
  /** Total number of tokens launched by this developer */
  totalTokensLaunched: int("totalTokensLaunched").default(0).notNull(),
  /** Number of tokens that successfully migrated */
  migratedTokens: int("migratedTokens").default(0).notNull(),
  /** Number of tokens that bonded successfully */
  bondedTokens: int("bondedTokens").default(0).notNull(),
  /** Number of tokens that failed/rugged/abandoned */
  failedTokens: int("failedTokens").default(0).notNull(),
  /** Calculated migration success percentage (0-100) */
  migrationSuccessRate: int("migrationSuccessRate").default(0).notNull(),
  /** Overall reputation score (0-100) */
  reputationScore: int("reputationScore").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Developer = typeof developers.$inferSelect;
export type InsertDeveloper = typeof developers.$inferInsert;

/**
 * Wallet associations table - links multiple wallets to a single developer
 */
export const walletAssociations = mysqlTable("walletAssociations", {
  id: int("id").autoincrement().primaryKey(),
  developerId: int("developerId").notNull(),
  walletAddress: varchar("walletAddress", { length: 44 }).notNull().unique(),
  /** Confidence score for this wallet belonging to the developer (0-100) */
  confidenceScore: int("confidenceScore").default(100).notNull(),
  /** How this wallet was associated (e.g., 'transaction_pattern', 'manual', 'twitter_link') */
  associationMethod: varchar("associationMethod", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WalletAssociation = typeof walletAssociations.$inferSelect;
export type InsertWalletAssociation = typeof walletAssociations.$inferInsert;

/**
 * Tokens table - stores information about tokens launched by developers
 */
export const tokens = mysqlTable("tokens", {
  id: int("id").autoincrement().primaryKey(),
  developerId: int("developerId").notNull(),
  tokenAddress: varchar("tokenAddress", { length: 44 }).notNull().unique(),
  name: text("name"),
  symbol: varchar("symbol", { length: 32 }),
  /** Token status: 'active', 'migrated', 'bonded', 'failed', 'rugged', 'abandoned' */
  status: mysqlEnum("status", ["active", "migrated", "bonded", "failed", "rugged", "abandoned"]).default("active").notNull(),
  launchDate: timestamp("launchDate"),
  migrationDate: timestamp("migrationDate"),
  /** Market cap at launch (in USD) */
  launchMarketCap: varchar("launchMarketCap", { length: 32 }),
  /** Current or final market cap (in USD) */
  currentMarketCap: varchar("currentMarketCap", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Token = typeof tokens.$inferSelect;
export type InsertToken = typeof tokens.$inferInsert;

/**
 * Migration events table - tracks token migration history
 */
export const migrationEvents = mysqlTable("migrationEvents", {
  id: int("id").autoincrement().primaryKey(),
  tokenId: int("tokenId").notNull(),
  /** Source platform (e.g., 'pump.fun') */
  fromPlatform: varchar("fromPlatform", { length: 64 }),
  /** Destination platform (e.g., 'raydium', 'orca') */
  toPlatform: varchar("toPlatform", { length: 64 }),
  /** Transaction signature for the migration */
  txSignature: varchar("txSignature", { length: 88 }),
  migrationDate: timestamp("migrationDate").notNull(),
  /** Whether the migration was successful */
  success: int("success").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MigrationEvent = typeof migrationEvents.$inferSelect;
export type InsertMigrationEvent = typeof migrationEvents.$inferInsert;

/**
 * Twitter linkages table - associates Twitter accounts/communities with developers
 */
export const twitterLinkages = mysqlTable("twitterLinkages", {
  id: int("id").autoincrement().primaryKey(),
  developerId: int("developerId").notNull(),
  /** Twitter username (without @) */
  twitterUsername: varchar("twitterUsername", { length: 64 }),
  /** Twitter user ID */
  twitterUserId: varchar("twitterUserId", { length: 64 }),
  /** Twitter community ID if applicable */
  twitterCommunityId: varchar("twitterCommunityId", { length: 64 }),
  /** Twitter community name */
  twitterCommunityName: text("twitterCommunityName"),
  /** Type: 'account' or 'community' */
  linkageType: mysqlEnum("linkageType", ["account", "community"]).notNull(),
  /** Verification status */
  verified: int("verified").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TwitterLinkage = typeof twitterLinkages.$inferSelect;
export type InsertTwitterLinkage = typeof twitterLinkages.$inferInsert;

/**
 * Notification subscriptions table - tracks user notification preferences
 */
export const notificationSubscriptions = mysqlTable("notificationSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  developerId: int("developerId").notNull(),
  /** Notify on new token launches */
  notifyOnLaunch: int("notifyOnLaunch").default(1).notNull(),
  /** Notify on successful migrations */
  notifyOnMigration: int("notifyOnMigration").default(1).notNull(),
  /** Notify on suspicious patterns */
  notifyOnSuspicious: int("notifyOnSuspicious").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationSubscription = typeof notificationSubscriptions.$inferSelect;
export type InsertNotificationSubscription = typeof notificationSubscriptions.$inferInsert;

/**
 * Notifications table - stores notification history
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  developerId: int("developerId").notNull(),
  tokenId: int("tokenId"),
  /** Notification type: 'launch', 'migration', 'suspicious', 'rug_pull' */
  notificationType: mysqlEnum("notificationType", ["launch", "migration", "suspicious", "rug_pull"]).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  /** Whether the notification has been read */
  isRead: int("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;