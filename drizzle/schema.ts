import { integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const roleEnum = pgEnum('role', ['user', 'admin']);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default('user').notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Developer profiles - aggregated reputation data
 */
export const tokenStatusEnum = pgEnum('token_status', ['active', 'migrated', 'bonded', 'failed', 'rugged', 'abandoned']);

export const developers = pgTable("developers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  displayName: text("displayName"),
  primaryWallet: varchar("primaryWallet", { length: 64 }).notNull().unique(),
  totalTokensLaunched: integer("totalTokensLaunched").default(0).notNull(),
  migratedTokens: integer("migratedTokens").default(0).notNull(),
  bondedTokens: integer("bondedTokens").default(0).notNull(),
  failedTokens: integer("failedTokens").default(0).notNull(),
  migrationSuccessRate: integer("migrationSuccessRate").default(0).notNull(),
  reputationScore: integer("reputationScore").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Developer = typeof developers.$inferSelect;
export type InsertDeveloper = typeof developers.$inferInsert;

/**
 * Wallet associations - links multiple wallets to same developer
 */
export const walletAssociations = pgTable("wallet_associations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  developerId: integer("developerId").notNull().references(() => developers.id),
  walletAddress: varchar("walletAddress", { length: 64 }).notNull().unique(),
  confidence: integer("confidence").default(100).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WalletAssociation = typeof walletAssociations.$inferSelect;
export type InsertWalletAssociation = typeof walletAssociations.$inferInsert;

/**
 * Token metadata - all tokens launched by developers
 */
export const tokens = pgTable("tokens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  tokenAddress: varchar("tokenAddress", { length: 64 }).notNull().unique(),
  developerId: integer("developerId").notNull().references(() => developers.id),
  name: text("name"),
  symbol: varchar("symbol", { length: 32 }),
  status: tokenStatusEnum("status").default('active').notNull(),
  launchedAt: timestamp("launchedAt").defaultNow().notNull(),
  migratedAt: timestamp("migratedAt"),
  bondedAt: timestamp("bondedAt"),
  failedAt: timestamp("failedAt"),
  initialMarketCap: integer("initialMarketCap"),
  peakMarketCap: integer("peakMarketCap"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Token = typeof tokens.$inferSelect;
export type InsertToken = typeof tokens.$inferInsert;

/**
 * Migration events - track Pump.fun migrations
 */
export const migrationEvents = pgTable("migration_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  tokenId: integer("tokenId").notNull().references(() => tokens.id),
  fromPlatform: varchar("fromPlatform", { length: 64 }).default('pump.fun').notNull(),
  toPlatform: varchar("toPlatform", { length: 64 }),
  transactionSignature: varchar("transactionSignature", { length: 128 }).notNull(),
  marketCapAtMigration: integer("marketCapAtMigration"),
  migratedAt: timestamp("migratedAt").defaultNow().notNull(),
});

export type MigrationEvent = typeof migrationEvents.$inferSelect;
export type InsertMigrationEvent = typeof migrationEvents.$inferInsert;

/**
 * Twitter linkages - social presence tracking
 */
export const twitterLinkages = pgTable("twitter_linkages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  developerId: integer("developerId").references(() => developers.id),
  tokenId: integer("tokenId").references(() => tokens.id),
  twitterHandle: varchar("twitterHandle", { length: 64 }),
  twitterUserId: varchar("twitterUserId", { length: 64 }),
  twitterCommunityId: varchar("twitterCommunityId", { length: 64 }),
  isAdmin: integer("isAdmin").default(0).notNull(), // 0 = false, 1 = true
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TwitterLinkage = typeof twitterLinkages.$inferSelect;
export type InsertTwitterLinkage = typeof twitterLinkages.$inferInsert;

/**
 * Notification preferences - user subscriptions
 */
export const notificationPreferences = pgTable("notification_preferences", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().references(() => users.id),
  developerId: integer("developerId").references(() => developers.id),
  notifyOnLaunch: integer("notifyOnLaunch").default(1).notNull(),
  notifyOnMigration: integer("notifyOnMigration").default(1).notNull(),
  notifyOnSuspicious: integer("notifyOnSuspicious").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;
