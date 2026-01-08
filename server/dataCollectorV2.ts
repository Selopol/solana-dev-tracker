/**
 * Data Collector V2
 * Uses PumpPortal (real-time) + Moralis (historical) + Helius (creator lookup)
 */

import { getDb } from './db';
import { getTokenMetadata as getHeliusTokenMetadata } from './heliusService';
import { getGraduatedTokens, getAllGraduatedTokens, GraduatedToken, getTokenCreator as getMoralisTokenCreator } from './moralisService';
import { 
  connectPumpPortal, 
  onNewToken, 
  onMigration, 
  getTokenCreator as getPumpPortalCreator,
  setTokenCreator,
  NewTokenEvent,
  MigrationEvent as PumpPortalMigration
} from './pumpPortalService';
import { findDevTwitter } from './twitterDevService';
import { developers, tokens, walletAssociations, migrationEvents, twitterLinkages } from '../drizzle/schema';
import { eq, desc, sql } from 'drizzle-orm';

const processedTokens = new Set<string>();
let isRunning = false;

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
    console.error('[CollectorV2] Error creating developer:', error);
    return null;
  }
}

/**
 * Update developer statistics
 */
async function updateDeveloperStats(developerId: number) {
  const db = await getDb();
  if (!db) return;

  try {
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
    console.error('[CollectorV2] Error updating developer stats:', error);
  }
}

/**
 * Process a new token event from PumpPortal
 */
async function processNewToken(event: NewTokenEvent) {
  const db = await getDb();
  if (!db) return;

  try {
    // Skip if already processed
    if (processedTokens.has(event.mint)) {
      return;
    }

    console.log(`[CollectorV2] Processing new token: ${event.symbol} (${event.mint.substring(0, 8)}...)`);

    // The creator is in traderPublicKey
    const creatorWallet = event.traderPublicKey;
    
    // Cache the creator
    setTokenCreator(event.mint, creatorWallet);

    // Get or create developer
    const developerId = await getOrCreateDeveloper(creatorWallet);
    if (!developerId) return;

    // Check if token already exists
    const existingToken = await db
      .select()
      .from(tokens)
      .where(eq(tokens.tokenAddress, event.mint))
      .limit(1);

    if (existingToken.length === 0) {
      // Create new token
      await db.insert(tokens).values({
        tokenAddress: event.mint,
        developerId,
        name: event.name,
        symbol: event.symbol,
        status: 'bonded', // New tokens start in bonded status
        launchedAt: new Date(),
      });
    }

    // Update developer stats
    await updateDeveloperStats(developerId);

    processedTokens.add(event.mint);
    console.log(`[CollectorV2] ✅ New token processed: ${event.symbol} by ${creatorWallet.substring(0, 8)}...`);

  } catch (error) {
    console.error('[CollectorV2] Error processing new token:', error);
  }
}

/**
 * Process a migration event from PumpPortal
 */
async function processPumpPortalMigration(event: PumpPortalMigration) {
  const db = await getDb();
  if (!db) return;

  try {
    console.log(`[CollectorV2] Processing migration: ${event.mint.substring(0, 8)}...`);

    // Try to get creator from cache first
    let creatorWallet: string | undefined | null = getPumpPortalCreator(event.mint);

    // If not in cache, try Moralis (first swap = creator)
    if (!creatorWallet) {
      console.log(`[CollectorV2] Creator not in cache, fetching from Moralis...`);
      creatorWallet = await getMoralisTokenCreator(event.mint);
    }

    if (!creatorWallet) {
      console.log(`[CollectorV2] Could not find creator for ${event.mint.substring(0, 8)}...`);
      return;
    }

    // Get or create developer
    const developerId = await getOrCreateDeveloper(creatorWallet);
    if (!developerId) return;

    // Get token metadata
    const tokenMeta = await getHeliusTokenMetadata(event.mint);

    // Check if token already exists
    const existingToken = await db
      .select()
      .from(tokens)
      .where(eq(tokens.tokenAddress, event.mint))
      .limit(1);

    let tokenId: number;

    if (existingToken.length > 0) {
      tokenId = existingToken[0].id;
      // Update token status to migrated
      await db
        .update(tokens)
        .set({ 
          status: 'migrated',
          migratedAt: new Date()
        })
        .where(eq(tokens.id, tokenId));
    } else {
      // Create new token
      const result = await db
        .insert(tokens)
        .values({
          tokenAddress: event.mint,
          developerId,
          name: tokenMeta?.onChainMetadata?.metadata?.name || `Token ${event.mint.substring(0, 8)}`,
          symbol: tokenMeta?.onChainMetadata?.metadata?.symbol || null,
          status: 'migrated',
          launchedAt: new Date(),
          migratedAt: new Date(),
        })
        .returning({ id: tokens.id });

      tokenId = result[0]?.id || 0;
    }

    // Create migration event
    if (tokenId) {
      await db.insert(migrationEvents).values({
        tokenId,
        transactionSignature: event.signature,
        fromPlatform: 'pump.fun',
        toPlatform: 'pumpswap',
        migratedAt: new Date(),
      }).onConflictDoNothing();
    }

    // Update developer stats
    await updateDeveloperStats(developerId);

    // Try to find Twitter account
    const twitterUser = await findDevTwitter(
      event.mint, 
      tokenMeta?.onChainMetadata?.metadata?.symbol
    );

    if (twitterUser) {
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

    console.log(`[CollectorV2] ✅ Migration processed: ${event.mint.substring(0, 8)}... by ${creatorWallet.substring(0, 8)}...`);

  } catch (error) {
    console.error('[CollectorV2] Error processing migration:', error);
  }
}

/**
 * Load historical graduated tokens from Moralis
 */
export async function loadHistoricalGraduatedTokens(limit: number = 500) {
  console.log(`[CollectorV2] Loading historical graduated tokens from Moralis...`);
  
  const db = await getDb();
  if (!db) {
    console.error('[CollectorV2] Database not available');
    return;
  }

  try {
    const graduatedTokens = await getAllGraduatedTokens(limit);
    console.log(`[CollectorV2] Found ${graduatedTokens.length} graduated tokens`);

    let processed = 0;
    let skipped = 0;

    for (const token of graduatedTokens) {
      // Skip if already processed
      if (processedTokens.has(token.tokenAddress)) {
        skipped++;
        continue;
      }

      // Check if token already in database
      const existingToken = await db
        .select()
        .from(tokens)
        .where(eq(tokens.tokenAddress, token.tokenAddress))
        .limit(1);

      if (existingToken.length > 0) {
        processedTokens.add(token.tokenAddress);
        skipped++;
        continue;
      }

      // Get creator from Moralis (first swap = creator)
      const creatorWallet = await getMoralisTokenCreator(token.tokenAddress);
      
      if (!creatorWallet) {
        console.log(`[CollectorV2] Could not find creator for ${token.symbol} (${token.tokenAddress.substring(0, 8)}...)`);
        continue;
      }

      // Get or create developer
      const developerId = await getOrCreateDeveloper(creatorWallet);
      if (!developerId) continue;

      // Create token
      const result = await db
        .insert(tokens)
        .values({
          tokenAddress: token.tokenAddress,
          developerId,
          name: token.name,
          symbol: token.symbol,
          status: 'migrated',
          launchedAt: new Date(token.graduatedAt),
          migratedAt: new Date(token.graduatedAt),
        })
        .returning({ id: tokens.id });

      const tokenId = result[0]?.id;

      // Create migration event
      if (tokenId) {
        await db.insert(migrationEvents).values({
          tokenId,
          transactionSignature: `moralis_import_${token.tokenAddress}`,
          fromPlatform: 'pump.fun',
          toPlatform: 'pumpswap',
          migratedAt: new Date(token.graduatedAt),
        }).onConflictDoNothing();
      }

      // Update developer stats
      await updateDeveloperStats(developerId);

      processedTokens.add(token.tokenAddress);
      processed++;

      // Rate limiting
      if (processed % 10 === 0) {
        console.log(`[CollectorV2] Processed ${processed}/${graduatedTokens.length} tokens...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`[CollectorV2] ✅ Historical load complete: ${processed} processed, ${skipped} skipped`);

  } catch (error) {
    console.error('[CollectorV2] Error loading historical data:', error);
  }
}

/**
 * Start real-time monitoring with PumpPortal
 */
export async function startRealTimeMonitoring() {
  if (isRunning) {
    console.log('[CollectorV2] Already running');
    return;
  }

  isRunning = true;
  console.log('[CollectorV2] 🚀 Starting real-time monitoring...');

  try {
    // Connect to PumpPortal WebSocket
    await connectPumpPortal();

    // Register event handlers
    onNewToken(async (event) => {
      await processNewToken(event);
    });

    onMigration(async (event) => {
      await processPumpPortalMigration(event);
    });

    console.log('[CollectorV2] ✅ Real-time monitoring started');

  } catch (error) {
    console.error('[CollectorV2] Error starting real-time monitoring:', error);
    isRunning = false;
  }
}

/**
 * Stop monitoring
 */
export function stopMonitoring() {
  isRunning = false;
  console.log('[CollectorV2] Monitoring stopped');
}

/**
 * Get stats
 */
export function getCollectorStats() {
  return {
    processedTokens: processedTokens.size,
    isRunning,
  };
}
