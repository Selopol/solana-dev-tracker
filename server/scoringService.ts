import {
  getDeveloperByWallet,
  getTokensByDeveloper,
  getWalletsByDeveloper,
  updateDeveloperScores,
  createDeveloper,
  addWalletAssociation,
} from "./developerDb";
import { analyzeWalletActivity, getSignaturesForAddress } from "./solanaService";

/**
 * Developer Scoring and Wallet Clustering Service
 * Calculates reputation scores and links related wallets
 */

interface WalletCluster {
  primaryWallet: string;
  associatedWallets: string[];
  confidence: number;
}

interface DeveloperScore {
  totalTokensLaunched: number;
  migratedTokens: number;
  bondedTokens: number;
  failedTokens: number;
  migrationSuccessRate: number;
  reputationScore: number;
}

/**
 * Calculate migration success rate
 */
export function calculateMigrationSuccessRate(totalTokens: number, migratedTokens: number): number {
  if (totalTokens === 0) return 0;
  return Math.round((migratedTokens / totalTokens) * 100);
}

/**
 * Calculate overall reputation score
 * Factors:
 * - Migration success rate (40%)
 * - Total tokens launched (20%)
 * - Bonded vs failed ratio (30%)
 * - Consistency (10%)
 */
export function calculateReputationScore(data: {
  totalTokens: number;
  migratedTokens: number;
  bondedTokens: number;
  failedTokens: number;
}): number {
  const { totalTokens, migratedTokens, bondedTokens, failedTokens } = data;
  const migrationSuccessRate = calculateMigrationSuccessRate(totalTokens, migratedTokens);
  // Migration success component (0-40 points)
  const migrationComponent = (migrationSuccessRate / 100) * 40;

  // Volume component (0-20 points, capped at 10 tokens)
  const volumeComponent = Math.min(totalTokens / 10, 1) * 20;

  // Success ratio component (0-30 points)
  const totalSuccessful = bondedTokens;
  const successRatio = totalTokens > 0 ? totalSuccessful / totalTokens : 0;
  const successComponent = successRatio * 30;

  // Consistency component (0-10 points)
  // Penalize developers with high failure rates
  const failureRate = totalTokens > 0 ? failedTokens / totalTokens : 0;
  const consistencyComponent = (1 - failureRate) * 10;

  const totalScore = migrationComponent + volumeComponent + successComponent + consistencyComponent;

  return Math.round(Math.min(100, Math.max(0, totalScore)));
}

/**
 * Calculate developer scores based on token history
 */
export async function calculateDeveloperScore(developerId: number): Promise<DeveloperScore> {
  const tokens = await getTokensByDeveloper(developerId);

  let totalTokensLaunched = tokens.length;
  let migratedTokens = 0;
  let bondedTokens = 0;
  let failedTokens = 0;

  for (const token of tokens) {
    switch (token.status) {
      case "migrated":
        migratedTokens++;
        break;
      case "bonded":
        bondedTokens++;
        break;
      case "failed":
      case "rugged":
      case "abandoned":
        failedTokens++;
        break;
    }
  }

  const migrationSuccessRate = calculateMigrationSuccessRate(totalTokensLaunched, migratedTokens);
  const reputationScore = calculateReputationScore({
    totalTokens: totalTokensLaunched,
    migratedTokens,
    bondedTokens,
    failedTokens,
  });

  return {
    totalTokensLaunched,
    migratedTokens,
    bondedTokens,
    failedTokens,
    migrationSuccessRate,
    reputationScore,
  };
}

/**
 * Update developer scores in database
 */
export async function updateDeveloperScoresInDb(developerId: number): Promise<void> {
  const scores = await calculateDeveloperScore(developerId);
  await updateDeveloperScores(developerId, scores);
}

/**
 * Analyze transaction patterns to find related wallets
 * Wallets are considered related if they:
 * 1. Frequently transact with each other
 * 2. Share similar transaction patterns
 * 3. Are involved in the same token launches
 */
async function findRelatedWallets(primaryWallet: string): Promise<string[]> {
  const relatedWallets = new Set<string>();

  try {
    // Get transaction history
    const signatures = await getSignaturesForAddress(primaryWallet, 200);

    // Track wallets that appear frequently in transactions
    const walletFrequency = new Map<string, number>();

    for (const sig of signatures) {
      // In a real implementation, you would parse each transaction
      // and extract all involved wallet addresses
      // For now, this is a simplified placeholder
    }

    // Return wallets that appear in more than 10% of transactions
    const threshold = signatures.length * 0.1;
    walletFrequency.forEach((count, wallet) => {
      if (count >= threshold && wallet !== primaryWallet) {
        relatedWallets.add(wallet);
      }
    });
  } catch (error) {
    console.error("Failed to find related wallets:", error);
  }

  return Array.from(relatedWallets);
}

/**
 * Cluster wallets belonging to the same developer
 * Uses heuristics like:
 * - Frequent transactions between wallets
 * - Similar token launch patterns
 * - Shared Twitter mentions
 */
export async function clusterWallets(walletAddress: string): Promise<WalletCluster> {
  const relatedWallets = await findRelatedWallets(walletAddress);

  // Calculate confidence based on number of connections and transaction patterns
  const confidence = Math.min(100, relatedWallets.length * 15);

  return {
    primaryWallet: walletAddress,
    associatedWallets: relatedWallets,
    confidence,
  };
}

/**
 * Associate a new wallet with an existing developer
 */
export async function associateWalletWithDeveloper(
  developerId: number,
  walletAddress: string,
  method: string,
  confidence: number = 100
): Promise<void> {
  await addWalletAssociation({
    developerId,
    walletAddress,
    confidenceScore: confidence,
    associationMethod: method,
  });
}

/**
 * Create or update developer profile from wallet analysis
 */
export async function createOrUpdateDeveloperProfile(
  walletAddress: string,
  displayName?: string
): Promise<number> {
  // Check if developer already exists
  let developer = await getDeveloperByWallet(walletAddress);

  if (developer) {
    // Update scores
    await updateDeveloperScoresInDb(developer.id);
    return developer.id;
  }

  // Create new developer
  await createDeveloper({
    primaryWallet: walletAddress,
    displayName: displayName || null,
    totalTokensLaunched: 0,
    migratedTokens: 0,
    bondedTokens: 0,
    failedTokens: 0,
    migrationSuccessRate: 0,
    reputationScore: 0,
  });

  // Get the newly created developer
  developer = await getDeveloperByWallet(walletAddress);
  if (!developer) {
    throw new Error("Failed to create developer profile");
  }

  // Analyze wallet and cluster related wallets
  const cluster = await clusterWallets(walletAddress);
  for (const relatedWallet of cluster.associatedWallets) {
    await associateWalletWithDeveloper(
      developer.id,
      relatedWallet,
      "transaction_pattern",
      cluster.confidence
    );
  }

  return developer.id;
}

/**
 * Batch update all developer scores
 * Should be run periodically as a background job
 */
export async function batchUpdateAllScores(): Promise<void> {
  console.log("Starting batch score update...");

  try {
    const { getAllDevelopers } = await import("./developerDb");
    const developers = await getAllDevelopers(1000);

    for (const developer of developers) {
      try {
        await updateDeveloperScoresInDb(developer.id);
        console.log(`Updated scores for developer ${developer.id}`);
      } catch (error) {
        console.error(`Failed to update scores for developer ${developer.id}:`, error);
      }
    }

    console.log("Batch score update completed");
  } catch (error) {
    console.error("Batch score update failed:", error);
  }
}

/**
 * Detect suspicious patterns in developer behavior
 */
export async function detectSuspiciousPatterns(developerId: number): Promise<{
  isSuspicious: boolean;
  patterns: string[];
  riskScore: number;
}> {
  const tokens = await getTokensByDeveloper(developerId);
  const patterns: string[] = [];
  let riskScore = 0;

  // Pattern 1: High failure rate
  const failedCount = tokens.filter((t) =>
    ["failed", "rugged", "abandoned"].includes(t.status)
  ).length;
  const failureRate = tokens.length > 0 ? failedCount / tokens.length : 0;

  if (failureRate > 0.5 && tokens.length >= 3) {
    patterns.push("High failure rate (>50%)");
    riskScore += 40;
  }

  // Pattern 2: Multiple rugs
  const rugCount = tokens.filter((t) => t.status === "rugged").length;
  if (rugCount >= 2) {
    patterns.push(`Multiple rug pulls detected (${rugCount})`);
    riskScore += 50;
  }

  // Pattern 3: Rapid launch and abandon pattern
  const recentTokens = tokens.slice(0, 5);
  const recentAbandoned = recentTokens.filter((t) => t.status === "abandoned").length;
  if (recentAbandoned >= 3) {
    patterns.push("Pattern of rapid launches and abandonment");
    riskScore += 30;
  }

  // Pattern 4: No successful migrations
  const hasSuccessfulMigration = tokens.some((t) => t.status === "migrated");
  if (!hasSuccessfulMigration && tokens.length >= 5) {
    patterns.push("No successful migrations despite multiple launches");
    riskScore += 20;
  }

  return {
    isSuspicious: riskScore >= 50,
    patterns,
    riskScore: Math.min(100, riskScore),
  };
}

/**
 * Get developer risk assessment
 */
export async function assessDeveloperRisk(developerId: number): Promise<{
  riskLevel: "low" | "medium" | "high" | "critical";
  score: number;
  factors: string[];
}> {
  const suspicious = await detectSuspiciousPatterns(developerId);
  const scores = await calculateDeveloperScore(developerId);

  let riskLevel: "low" | "medium" | "high" | "critical" = "low";
  const factors: string[] = [...suspicious.patterns];

  if (suspicious.riskScore >= 80) {
    riskLevel = "critical";
  } else if (suspicious.riskScore >= 60) {
    riskLevel = "high";
  } else if (suspicious.riskScore >= 30) {
    riskLevel = "medium";
  }

  // Add reputation-based factors
  if (scores.reputationScore < 30) {
    factors.push("Low reputation score");
  }

  return {
    riskLevel,
    score: suspicious.riskScore,
    factors,
  };
}
