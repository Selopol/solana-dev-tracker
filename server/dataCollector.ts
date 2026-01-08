/**
 * Main Data Collector Service
 * Combines Helius RPC scanning and Twitter dev detection
 * Runs 24/7 and populates the database
 */

import { getDb } from './db';
import { 
  scanMigrationsLastDays, 
  checkNewMigrations, 
  getTokenMetadata
} from './heliusService';
import { findDevTwitter } from './twitterDevService';
import { developers, tokens, walletAssociations, migrationEvents, twitterLinkages } from '../drizzle/schema';
import { eq, desc, sql } from 'drizzle-orm';

const SCAN_INTERVAL = 10000; // 10 seconds
let isRunning = false;
let lastProcessedSignature: string | null = null;
let processedSignatures = new Set<string>();

interface DevStats {
  id: number;
  primaryWallet: string;
  twitterHandle: string | null;
  totalTokensLaunched: number;
  migratedTokens: number;
  migrationSuccessRate: number;
  lastMigrationAt: Date | null;
}

/**
 * Get or create developer by wallet
 */
async function getOrCreateDeveloper(wallet: string): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Check if wallet association exists
    const existing = await db
      .select()
      .from(walletAssociations)
      .where(eq(walletAssociations.walletAddress, wallet))
      .limit(1);

    if (existing.length > 0) {
      return existing[0].developerId;
    }

    // Create new developer
    const result = await db
      .insert(developers)
      .values({
        primaryWallet: wallet,
        totalTokensLaunched: 0,
        migratedTokens: 0,
        bondedTokens: 0,
        failedTokens: 0,
        migrationSuccessRate: 0,
        reputationScore: 50,
      })
      .returning({ id: developers.id });

    const developerId = result[0]?.id;

    if (developerId) {
      // Create wallet association
      await db.insert(walletAssociations).values({
        developerId,
        walletAddress: wallet,
        confidence: 100,
      });
    }

    return developerId || null;
  } catch (error) {
    console.error('[Collector] Error creating developer:', error);
    return null;
  }
}

/**
 * Process a migration event
 */
async function processMigration(migration: any) {
  const db = await getDb();
  if (!db) return;

  try {
    // Skip if already processed
    if (processedSignatures.has(migration.signature)) {
      return;
    }

    console.log(`[Collector] Processing migration: ${migration.signature.substring(0, 12)}...`);

    // Get or create developer
    const developerId = await getOrCreateDeveloper(migration.devWallet);
    if (!developerId) return;

    // Get token metadata
    const tokenMeta = await getTokenMetadata(migration.tokenMint);

    // Check if token already exists
    const existingToken = await db
      .select()
      .from(tokens)
      .where(eq(tokens.tokenAddress, migration.tokenMint))
      .limit(1);

    let tokenId: number;

    if (existingToken.length > 0) {
      tokenId = existingToken[0].id;
      // Update token status to migrated
      await db
        .update(tokens)
        .set({ 
          status: 'migrated',
          migratedAt: new Date(migration.blockTime * 1000)
        })
        .where(eq(tokens.id, tokenId));
    } else {
      // Create new token
      const result = await db
        .insert(tokens)
        .values({
          tokenAddress: migration.tokenMint,
          developerId,
          name: tokenMeta?.onChainMetadata?.metadata?.name || `Token ${migration.tokenMint.substring(0, 8)}`,
          symbol: tokenMeta?.onChainMetadata?.metadata?.symbol || null,
          status: 'migrated',
          launchedAt: new Date(migration.blockTime * 1000),
          migratedAt: new Date(migration.blockTime * 1000),
        })
        .returning({ id: tokens.id });

      tokenId = result[0]?.id || 0;
    }

    // Create migration event
    if (tokenId) {
      await db.insert(migrationEvents).values({
        tokenId,
        transactionSignature: migration.signature,
        fromPlatform: 'pump.fun',
        toPlatform: 'raydium',
        migratedAt: new Date(migration.blockTime * 1000),
      }).onConflictDoNothing();
    }

    // Update developer stats
    await updateDeveloperStats(developerId);

    // Try to find Twitter account
    const twitterUser = await findDevTwitter(
      migration.tokenMint, 
      tokenMeta?.onChainMetadata?.metadata?.symbol
    );

    if (twitterUser) {
      // Check if Twitter account already linked
      const existingTwitter = await db
        .select()
        .from(twitterLinkages)
        .where(eq(twitterLinkages.developerId, developerId))
        .limit(1);

      if (existingTwitter.length === 0) {
        await db.insert(twitterLinkages).values({
          developerId,
          twitterUserId: twitterUser.id,
          twitterHandle: twitterUser.username,
        });
      }
    }

    processedSignatures.add(migration.signature);
    console.log(`[Collector] ✅ Processed: ${migration.tokenMint.substring(0, 8)}... by ${migration.devWallet.substring(0, 8)}...`);

  } catch (error) {
    console.error('[Collector] Error processing migration:', error);
  }
}

/**
 * Update developer statistics
 */
async function updateDeveloperStats(developerId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // Count tokens by status
    const tokenStats = await db
      .select({
        total: sql<number>`count(*)`,
        migrated: sql<number>`sum(case when status = 'migrated' then 1 else 0 end)`,
        bonded: sql<number>`sum(case when status = 'bonded' then 1 else 0 end)`,
        failed: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`,
      })
      .from(tokens)
      .where(eq(tokens.developerId, developerId));

    const stats = tokenStats[0];
    const total = Number(stats?.total) || 0;
    const migrated = Number(stats?.migrated) || 0;
    const bonded = Number(stats?.bonded) || 0;
    const failed = Number(stats?.failed) || 0;

    const migrationRate = total > 0 ? Math.round((migrated / total) * 100) : 0;

    // Get last migration time
    const lastMigration = await db
      .select({ migratedAt: tokens.migratedAt })
      .from(tokens)
      .where(eq(tokens.developerId, developerId))
      .orderBy(desc(tokens.migratedAt))
      .limit(1);

    await db
      .update(developers)
      .set({
        totalTokensLaunched: total,
        migratedTokens: migrated,
        bondedTokens: bonded,
        failedTokens: failed,
        migrationSuccessRate: migrationRate,
        updatedAt: new Date(),
      })
      .where(eq(developers.id, developerId));

  } catch (error) {
    console.error('[Collector] Error updating developer stats:', error);
  }
}

/**
 * Load historical data from last 30 days
 */
export async function loadHistoricalData() {
  console.log('[Collector] Loading historical migrations from last 30 days...');
  
  try {
    const migrations = await scanMigrationsLastDays(30);
    
    console.log(`[Collector] Found ${migrations.length} migrations to process`);
    
    for (const migration of migrations) {
      await processMigration(migration);
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('[Collector] ✅ Historical data loaded');
  } catch (error) {
    console.error('[Collector] Error loading historical data:', error);
  }
}

/**
 * Check for new migrations
 */
async function scanNewMigrations() {
  try {
    const migrations = await checkNewMigrations(lastProcessedSignature || undefined);
    
    if (migrations.length > 0) {
      console.log(`[Collector] Found ${migrations.length} new migrations`);
      
      for (const migration of migrations) {
        await processMigration(migration);
      }

      // Update last processed signature
      lastProcessedSignature = migrations[0]?.signature || lastProcessedSignature;
    }
  } catch (error) {
    console.error('[Collector] Error scanning new migrations:', error);
  }
}

/**
 * Start continuous monitoring
 */
export function startContinuousMonitoring() {
  if (isRunning) {
    console.log('[Collector] Already running');
    return;
  }

  isRunning = true;
  console.log('[Collector] 🚀 Starting continuous monitoring (every 10 seconds)...');

  // Run immediately
  scanNewMigrations();

  // Then run every 10 seconds
  setInterval(async () => {
    if (isRunning) {
      await scanNewMigrations();
    }
  }, SCAN_INTERVAL);

  console.log('[Collector] ✅ Continuous monitoring started');
}

/**
 * Stop monitoring
 */
export function stopContinuousMonitoring() {
  isRunning = false;
  console.log('[Collector] Monitoring stopped');
}

/**
 * Get top developers by migration percentage
 */
export async function getTopDevsByMigrationRate(limit: number = 20): Promise<DevStats[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const devs = await db
      .select({
        id: developers.id,
        primaryWallet: developers.primaryWallet,
        totalTokensLaunched: developers.totalTokensLaunched,
        migratedTokens: developers.migratedTokens,
        migrationSuccessRate: developers.migrationSuccessRate,
      })
      .from(developers)
      .where(sql`${developers.totalTokensLaunched} > 0`)
      .orderBy(desc(developers.migrationSuccessRate))
      .limit(limit);

    // Get Twitter handles for each dev
    const result: DevStats[] = [];
    
    for (const dev of devs) {
      const twitter = await db
        .select({ handle: twitterLinkages.twitterHandle })
        .from(twitterLinkages)
        .where(eq(twitterLinkages.developerId, dev.id))
        .limit(1);

      const lastMigration = await db
        .select({ migratedAt: tokens.migratedAt })
        .from(tokens)
        .where(eq(tokens.developerId, dev.id))
        .orderBy(desc(tokens.migratedAt))
        .limit(1);

      result.push({
        id: dev.id,
        primaryWallet: dev.primaryWallet,
        twitterHandle: twitter[0]?.handle || null,
        totalTokensLaunched: dev.totalTokensLaunched || 0,
        migratedTokens: dev.migratedTokens || 0,
        migrationSuccessRate: dev.migrationSuccessRate || 0,
        lastMigrationAt: lastMigration[0]?.migratedAt || null,
      });
    }

    return result;
  } catch (error) {
    console.error('[Collector] Error getting top devs:', error);
    return [];
  }
}

/**
 * Get top developers by migration count
 */
export async function getTopDevsByMigrationCount(limit: number = 20): Promise<DevStats[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const devs = await db
      .select({
        id: developers.id,
        primaryWallet: developers.primaryWallet,
        totalTokensLaunched: developers.totalTokensLaunched,
        migratedTokens: developers.migratedTokens,
        migrationSuccessRate: developers.migrationSuccessRate,
      })
      .from(developers)
      .where(sql`${developers.migratedTokens} > 0`)
      .orderBy(desc(developers.migratedTokens))
      .limit(limit);

    // Get Twitter handles for each dev
    const result: DevStats[] = [];
    
    for (const dev of devs) {
      const twitter = await db
        .select({ handle: twitterLinkages.twitterHandle })
        .from(twitterLinkages)
        .where(eq(twitterLinkages.developerId, dev.id))
        .limit(1);

      const lastMigration = await db
        .select({ migratedAt: tokens.migratedAt })
        .from(tokens)
        .where(eq(tokens.developerId, dev.id))
        .orderBy(desc(tokens.migratedAt))
        .limit(1);

      result.push({
        id: dev.id,
        primaryWallet: dev.primaryWallet,
        twitterHandle: twitter[0]?.handle || null,
        totalTokensLaunched: dev.totalTokensLaunched || 0,
        migratedTokens: dev.migratedTokens || 0,
        migrationSuccessRate: dev.migrationSuccessRate || 0,
        lastMigrationAt: lastMigration[0]?.migratedAt || null,
      });
    }

    return result;
  } catch (error) {
    console.error('[Collector] Error getting top devs:', error);
    return [];
  }
}

/**
 * Get developer info by token mint
 */
export async function getDevByTokenMint(tokenMint: string): Promise<DevStats | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const token = await db
      .select({
        developerId: tokens.developerId,
      })
      .from(tokens)
      .where(eq(tokens.tokenAddress, tokenMint))
      .limit(1);

    if (token.length === 0) return null;

    const developerId = token[0].developerId;

    const dev = await db
      .select({
        id: developers.id,
        primaryWallet: developers.primaryWallet,
        totalTokensLaunched: developers.totalTokensLaunched,
        migratedTokens: developers.migratedTokens,
        migrationSuccessRate: developers.migrationSuccessRate,
      })
      .from(developers)
      .where(eq(developers.id, developerId))
      .limit(1);

    if (dev.length === 0) return null;

    const twitter = await db
      .select({ handle: twitterLinkages.twitterHandle })
      .from(twitterLinkages)
      .where(eq(twitterLinkages.developerId, developerId))
      .limit(1);

    const lastMigration = await db
      .select({ migratedAt: tokens.migratedAt })
      .from(tokens)
      .where(eq(tokens.developerId, developerId))
      .orderBy(desc(tokens.migratedAt))
      .limit(1);

    return {
      id: dev[0].id,
      primaryWallet: dev[0].primaryWallet,
      twitterHandle: twitter[0]?.handle || null,
      totalTokensLaunched: dev[0].totalTokensLaunched || 0,
      migratedTokens: dev[0].migratedTokens || 0,
      migrationSuccessRate: dev[0].migrationSuccessRate || 0,
      lastMigrationAt: lastMigration[0]?.migratedAt || null,
    };
  } catch (error) {
    console.error('[Collector] Error getting dev by token:', error);
    return null;
  }
}

/**
 * Get last update time
 */
export async function getLastUpdateTime(): Promise<Date | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select({ updatedAt: developers.updatedAt })
      .from(developers)
      .orderBy(desc(developers.updatedAt))
      .limit(1);

    return result[0]?.updatedAt || null;
  } catch (error) {
    return null;
  }
}
