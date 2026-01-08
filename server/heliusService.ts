/**
 * Helius RPC Service
 * Real scanning for Pump.fun AMM migrations
 */

const HELIUS_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=14649a76-7c70-443c-b6da-41cffe2543fd';

// Pump.fun program IDs
const PUMP_FUN_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const PUMP_AMM_PROGRAM = 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA';

interface HeliusTransaction {
  signature: string;
  slot: number;
  blockTime: number;
  err: any;
  memo: string | null;
}

interface ParsedTransaction {
  signature: string;
  blockTime: number;
  slot: number;
  feePayer: string;
  instructions: any[];
  tokenTransfers: any[];
  accountData: any[];
}

interface MigrationEvent {
  signature: string;
  tokenMint: string;
  devWallet: string;
  blockTime: number;
  slot: number;
}

/**
 * Get recent signatures for Pump AMM program
 */
export async function getPumpAMMSignatures(limit: number = 1000, before?: string): Promise<HeliusTransaction[]> {
  try {
    const body: any = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getSignaturesForAddress',
      params: [
        PUMP_AMM_PROGRAM,
        { limit, ...(before ? { before } : {}) }
      ]
    };

    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('[Helius] RPC error:', data.error);
      return [];
    }

    return data.result || [];
  } catch (error) {
    console.error('[Helius] Error fetching signatures:', error);
    return [];
  }
}

/**
 * Get parsed transaction details using Helius Enhanced API
 */
export async function getEnhancedTransaction(signature: string): Promise<ParsedTransaction | null> {
  try {
    const response = await fetch(`https://api.helius.xyz/v0/transactions/?api-key=14649a76-7c70-443c-b6da-41cffe2543fd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions: [signature] })
    });

    const data = await response.json();
    
    if (data && data.length > 0) {
      return data[0];
    }

    return null;
  } catch (error) {
    console.error('[Helius] Error fetching enhanced transaction:', error);
    return null;
  }
}

/**
 * Parse migration transaction to extract token mint and dev wallet
 */
export function parseMigrationTransaction(tx: ParsedTransaction): MigrationEvent | null {
  try {
    // The fee payer is typically the dev wallet
    const devWallet = tx.feePayer;
    
    // Find token mint from token transfers
    let tokenMint = '';
    
    if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
      // Get the first token transfer's mint
      tokenMint = tx.tokenTransfers[0]?.mint || '';
    }

    // If no token mint found, try to extract from instructions
    if (!tokenMint && tx.accountData) {
      for (const account of tx.accountData) {
        if (account.tokenBalanceChanges && account.tokenBalanceChanges.length > 0) {
          tokenMint = account.tokenBalanceChanges[0]?.mint || '';
          break;
        }
      }
    }

    if (!tokenMint || !devWallet) {
      return null;
    }

    return {
      signature: tx.signature,
      tokenMint,
      devWallet,
      blockTime: 0, // Will be filled from signature data
      slot: 0
    };
  } catch (error) {
    console.error('[Helius] Error parsing migration:', error);
    return null;
  }
}

/**
 * Scan for migrations in the last N days
 */
export async function scanMigrationsLastDays(days: number = 30): Promise<MigrationEvent[]> {
  console.log(`[Helius] Scanning migrations from last ${days} days...`);
  
  const migrations: MigrationEvent[] = [];
  const cutoffTime = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
  
  let before: string | undefined;
  let totalScanned = 0;
  let continueScanning = true;

  while (continueScanning && totalScanned < 5000) {
    const signatures = await getPumpAMMSignatures(100, before);
    
    if (signatures.length === 0) {
      break;
    }

    for (const sig of signatures) {
      // Check if we've gone past our cutoff time
      if (sig.blockTime && sig.blockTime < cutoffTime) {
        continueScanning = false;
        break;
      }

      // Skip failed transactions
      if (sig.err) continue;

      // Get enhanced transaction details
      const enhancedTx = await getEnhancedTransaction(sig.signature);
      
      if (enhancedTx) {
        const migration = parseMigrationTransaction(enhancedTx);
        
        if (migration) {
          migration.blockTime = sig.blockTime;
          migration.slot = sig.slot;
          migrations.push(migration);
          
          console.log(`[Helius] Found migration: ${migration.tokenMint.substring(0, 8)}... by ${migration.devWallet.substring(0, 8)}...`);
        }
      }

      totalScanned++;
      
      // Rate limiting - 10 requests per second
      if (totalScanned % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Get the last signature for pagination
    before = signatures[signatures.length - 1]?.signature;
    
    console.log(`[Helius] Scanned ${totalScanned} transactions, found ${migrations.length} migrations`);
  }

  console.log(`[Helius] ✅ Scan complete: ${migrations.length} migrations found`);
  return migrations;
}

/**
 * Monitor for new migrations in real-time
 */
export async function checkNewMigrations(lastSignature?: string): Promise<MigrationEvent[]> {
  const migrations: MigrationEvent[] = [];
  
  try {
    const signatures = await getPumpAMMSignatures(20);
    
    for (const sig of signatures) {
      // Stop if we've reached the last processed signature
      if (lastSignature && sig.signature === lastSignature) {
        break;
      }

      // Skip failed transactions
      if (sig.err) continue;

      const enhancedTx = await getEnhancedTransaction(sig.signature);
      
      if (enhancedTx) {
        const migration = parseMigrationTransaction(enhancedTx);
        
        if (migration) {
          migration.blockTime = sig.blockTime;
          migration.slot = sig.slot;
          migrations.push(migration);
        }
      }
    }
  } catch (error) {
    console.error('[Helius] Error checking new migrations:', error);
  }

  return migrations;
}

/**
 * Get token metadata
 */
export async function getTokenMetadata(mint: string): Promise<any> {
  try {
    const response = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=14649a76-7c70-443c-b6da-41cffe2543fd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mintAccounts: [mint] })
    });

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('[Helius] Error fetching token metadata:', error);
    return null;
  }
}

/**
 * Get all tokens created by a wallet
 */
export async function getWalletTokens(wallet: string): Promise<string[]> {
  try {
    const signatures = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [wallet, { limit: 1000 }]
      })
    });

    const data = await signatures.json();
    const tokens: string[] = [];

    // Parse signatures to find token creations
    for (const sig of (data.result || []).slice(0, 50)) {
      const tx = await getEnhancedTransaction(sig.signature);
      if (tx?.tokenTransfers) {
        for (const transfer of tx.tokenTransfers) {
          if (transfer.mint && !tokens.includes(transfer.mint)) {
            tokens.push(transfer.mint);
          }
        }
      }
    }

    return tokens;
  } catch (error) {
    console.error('[Helius] Error fetching wallet tokens:', error);
    return [];
  }
}


/**
 * Get asset info using Helius DAS API (includes creator/authority)
 */
export async function getAsset(mint: string): Promise<any> {
  try {
    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAsset',
        params: { id: mint }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('[Helius] getAsset error:', data.error);
      return null;
    }

    return data.result || null;
  } catch (error) {
    console.error('[Helius] Error fetching asset:', error);
    return null;
  }
}

/**
 * Get token creator from asset data
 * Returns the update authority or first creator address
 */
export async function getTokenCreator(mint: string): Promise<string | null> {
  try {
    const asset = await getAsset(mint);
    
    if (!asset) {
      return null;
    }

    // Try to get creator from authorities
    if (asset.authorities && asset.authorities.length > 0) {
      // Look for update authority
      const updateAuth = asset.authorities.find((a: any) => 
        a.scopes?.includes('metadata') || a.scopes?.includes('full')
      );
      if (updateAuth?.address) {
        return updateAuth.address;
      }
      // Fall back to first authority
      return asset.authorities[0]?.address || null;
    }

    // Try to get from creators array
    if (asset.creators && asset.creators.length > 0) {
      // Return first verified creator or first creator
      const verifiedCreator = asset.creators.find((c: any) => c.verified);
      if (verifiedCreator?.address) {
        return verifiedCreator.address;
      }
      return asset.creators[0]?.address || null;
    }

    // Try ownership
    if (asset.ownership?.owner) {
      return asset.ownership.owner;
    }

    return null;
  } catch (error) {
    console.error('[Helius] Error getting token creator:', error);
    return null;
  }
}

/**
 * Get multiple assets in batch
 */
export async function getAssetBatch(mints: string[]): Promise<Map<string, any>> {
  const results = new Map<string, any>();
  
  // Process in batches of 100
  const batchSize = 100;
  
  for (let i = 0; i < mints.length; i += batchSize) {
    const batch = mints.slice(i, i + batchSize);
    
    try {
      const response = await fetch(HELIUS_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getAssetBatch',
          params: { ids: batch }
        })
      });

      const data = await response.json();
      
      if (data.result && Array.isArray(data.result)) {
        for (const asset of data.result) {
          if (asset?.id) {
            results.set(asset.id, asset);
          }
        }
      }
    } catch (error) {
      console.error('[Helius] Error fetching asset batch:', error);
    }
    
    // Rate limiting
    if (i + batchSize < mints.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return results;
}
