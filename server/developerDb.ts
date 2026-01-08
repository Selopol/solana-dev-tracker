import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  developers,
  walletAssociations,
  tokens,
  migrationEvents,
  twitterLinkages,
  notificationPreferences,
  InsertDeveloper,
  InsertWalletAssociation,
  InsertToken,
  InsertMigrationEvent,
  InsertTwitterLinkage,
  InsertNotificationPreference,
} from "../drizzle/schema";

/**
 * Developer Profile Operations
 */

export async function createDeveloper(data: InsertDeveloper) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(developers).values(data);
  return result;
}

export async function getDeveloperByWallet(walletAddress: string) {
  const db = await getDb();
  if (!db) return null;
  
  // First check if this is a primary wallet
  const devs = await db
    .select()
    .from(developers)
    .where(eq(developers.primaryWallet, walletAddress))
    .limit(1);
  
  if (devs.length > 0) return devs[0];
  
  // Check if this is an associated wallet
  const associations = await db
    .select()
    .from(walletAssociations)
    .where(eq(walletAssociations.walletAddress, walletAddress))
    .limit(1);
  
  if (associations.length === 0) return null;
  
  const developer = await db
    .select()
    .from(developers)
    .where(eq(developers.id, associations[0].developerId))
    .limit(1);
  
  return developer.length > 0 ? developer[0] : null;
}

export async function getAllDevelopers(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(developers)
    .orderBy(desc(developers.reputationScore))
    .limit(limit)
    .offset(offset);
}

export async function updateDeveloperScores(developerId: number, scores: {
  totalTokensLaunched?: number;
  migratedTokens?: number;
  bondedTokens?: number;
  failedTokens?: number;
  migrationSuccessRate?: number;
  reputationScore?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(developers)
    .set(scores)
    .where(eq(developers.id, developerId));
}

/**
 * Wallet Association Operations
 */

export async function addWalletAssociation(data: InsertWalletAssociation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(walletAssociations).values(data);
  return result;
}

export async function getWalletsByDeveloper(developerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(walletAssociations)
    .where(eq(walletAssociations.developerId, developerId));
}

/**
 * Token Operations
 */

export async function createToken(data: InsertToken) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tokens).values(data);
  return result;
}

export async function getTokensByDeveloper(developerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(tokens)
    .where(eq(tokens.developerId, developerId))
    .orderBy(desc(tokens.launchedAt));
}

export async function getTokenByAddress(tokenAddress: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(tokens)
    .where(eq(tokens.tokenAddress, tokenAddress))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateTokenStatus(
  tokenId: number,
  status: "active" | "migrated" | "bonded" | "failed" | "rugged" | "abandoned",
  migrationDate?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (migrationDate) {
    updateData.migrationDate = migrationDate;
  }
  
  await db
    .update(tokens)
    .set(updateData)
    .where(eq(tokens.id, tokenId));
}

/**
 * Migration Event Operations
 */

export async function createMigrationEvent(data: InsertMigrationEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(migrationEvents).values(data);
  return result;
}

export async function getMigrationEventsByToken(tokenId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(migrationEvents)
    .where(eq(migrationEvents.tokenId, tokenId))
    .orderBy(desc(migrationEvents.migratedAt));
}

/**
 * Twitter Linkage Operations
 */

export async function createTwitterLinkage(data: InsertTwitterLinkage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(twitterLinkages).values(data);
  return result;
}

export async function getTwitterLinkagesByDeveloper(developerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(twitterLinkages)
    .where(eq(twitterLinkages.developerId, developerId));
}

/**
 * Notification Operations
 */

export async function createNotificationPreference(data: InsertNotificationPreference) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notificationPreferences).values(data);
  return result;
}

export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));
}

/**
 * Complex Queries for Developer Profiles with Related Data
 */

export async function getDeveloperProfile(developerId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const developer = await db
    .select()
    .from(developers)
    .where(eq(developers.id, developerId))
    .limit(1);
  
  if (developer.length === 0) return null;
  
  const wallets = await getWalletsByDeveloper(developerId);
  const tokenList = await getTokensByDeveloper(developerId);
  const twitterLinks = await getTwitterLinkagesByDeveloper(developerId);
  
  return {
    ...developer[0],
    wallets,
    tokens: tokenList,
    twitterAccounts: twitterLinks,
  };
}

export async function searchDevelopers(query: string, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(developers)
    .where(
      sql`${developers.displayName} LIKE ${`%${query}%`} OR ${developers.primaryWallet} LIKE ${`%${query}%`}`
    )
    .limit(limit);
}
