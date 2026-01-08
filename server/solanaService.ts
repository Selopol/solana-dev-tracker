import axios from "axios";

/**
 * Solana RPC Service for tracking developer wallets and token launches
 * Uses Helius RPC endpoint for enhanced Solana data access
 */

const HELIUS_RPC_URL = "https://mainnet.helius-rpc.com/?api-key=14649a76-7c70-443c-b6da-41cffe2543fd";

// Pump.fun program ID (example - needs to be verified)
const PUMP_FUN_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";

interface SolanaRpcRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params: any[];
}

interface TokenAccount {
  pubkey: string;
  account: {
    data: {
      parsed: {
        info: {
          mint: string;
          owner: string;
          tokenAmount: {
            amount: string;
            decimals: number;
            uiAmount: number;
          };
        };
      };
    };
  };
}

interface Transaction {
  signature: string;
  slot: number;
  blockTime: number;
  meta: {
    err: any;
    fee: number;
    postBalances: number[];
    preBalances: number[];
  };
  transaction: {
    message: {
      accountKeys: string[];
      instructions: any[];
    };
  };
}

/**
 * Make RPC call to Helius endpoint
 */
async function makeRpcCall(method: string, params: any[]): Promise<any> {
  const request: SolanaRpcRequest = {
    jsonrpc: "2.0",
    id: 1,
    method,
    params,
  };

  try {
    const response = await axios.post(HELIUS_RPC_URL, request, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.data.error) {
      throw new Error(`RPC Error: ${response.data.error.message}`);
    }

    return response.data.result;
  } catch (error) {
    console.error("Solana RPC call failed:", error);
    throw error;
  }
}

/**
 * Get token accounts owned by a wallet
 */
export async function getTokenAccountsByOwner(walletAddress: string): Promise<TokenAccount[]> {
  const result = await makeRpcCall("getTokenAccountsByOwner", [
    walletAddress,
    {
      programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    },
    {
      encoding: "jsonParsed",
    },
  ]);

  return result.value || [];
}

/**
 * Get transaction signatures for a wallet address
 */
export async function getSignaturesForAddress(
  address: string,
  limit: number = 100,
  before?: string
): Promise<any[]> {
  const params: any[] = [
    address,
    {
      limit,
    },
  ];

  if (before) {
    params[1].before = before;
  }

  const result = await makeRpcCall("getSignaturesForAddress", params);
  return result || [];
}

/**
 * Get parsed transaction details
 */
export async function getTransaction(signature: string): Promise<Transaction | null> {
  const result = await makeRpcCall("getTransaction", [
    signature,
    {
      encoding: "jsonParsed",
      maxSupportedTransactionVersion: 0,
    },
  ]);

  return result;
}

/**
 * Detect if a transaction is a token launch
 */
export function isTokenLaunchTransaction(transaction: Transaction): boolean {
  if (!transaction || !transaction.transaction) return false;

  const instructions = transaction.transaction.message.instructions;
  
  // Look for token creation instructions
  for (const instruction of instructions) {
    if (
      instruction.program === "spl-token" &&
      instruction.parsed?.type === "initializeMint"
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Detect if a transaction is a migration from Pump.fun
 */
export function isMigrationTransaction(transaction: Transaction): boolean {
  if (!transaction || !transaction.transaction) return false;

  const accountKeys = transaction.transaction.message.accountKeys;
  
  // Check if Pump.fun program is involved
  const hasPumpFunProgram = accountKeys.some(
    (key: any) => key === PUMP_FUN_PROGRAM_ID || key.pubkey === PUMP_FUN_PROGRAM_ID
  );

  // Look for liquidity pool creation or migration patterns
  const instructions = transaction.transaction.message.instructions;
  const hasLiquidityInstruction = instructions.some((instruction: any) => {
    return (
      instruction.program === "spl-associated-token-account" ||
      instruction.parsed?.type === "create" ||
      instruction.parsed?.type === "transfer"
    );
  });

  return hasPumpFunProgram && hasLiquidityInstruction;
}

/**
 * Get token metadata from mint address
 */
export async function getTokenMetadata(mintAddress: string): Promise<any> {
  try {
    const accountInfo = await makeRpcCall("getAccountInfo", [
      mintAddress,
      {
        encoding: "jsonParsed",
      },
    ]);

    if (!accountInfo || !accountInfo.value) {
      return null;
    }

    return accountInfo.value.data.parsed?.info || null;
  } catch (error) {
    console.error("Failed to get token metadata:", error);
    return null;
  }
}

/**
 * Analyze wallet activity to detect token launches
 */
export async function analyzeWalletActivity(walletAddress: string): Promise<{
  launches: any[];
  migrations: any[];
}> {
  const launches: any[] = [];
  const migrations: any[] = [];

  try {
    // Get recent signatures
    const signatures = await getSignaturesForAddress(walletAddress, 100);

    // Analyze each transaction
    for (const sig of signatures) {
      try {
        const transaction = await getTransaction(sig.signature);
        
        if (!transaction) continue;

        if (isTokenLaunchTransaction(transaction)) {
          launches.push({
            signature: sig.signature,
            blockTime: transaction.blockTime,
            slot: transaction.slot,
          });
        }

        if (isMigrationTransaction(transaction)) {
          migrations.push({
            signature: sig.signature,
            blockTime: transaction.blockTime,
            slot: transaction.slot,
          });
        }
      } catch (error) {
        console.error(`Failed to analyze transaction ${sig.signature}:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to analyze wallet activity:", error);
  }

  return { launches, migrations };
}

/**
 * Check if a token has bonded (achieved sufficient liquidity)
 */
export async function checkTokenBondingStatus(tokenAddress: string): Promise<{
  isBonded: boolean;
  liquidityUSD?: number;
}> {
  try {
    // Get token accounts to check liquidity
    const tokenAccounts = await getTokenAccountsByOwner(tokenAddress);
    
    // Simple heuristic: if token has multiple holders and significant supply distribution
    const holderCount = tokenAccounts.length;
    
    // Consider bonded if more than 10 holders (simplified logic)
    const isBonded = holderCount > 10;
    
    return {
      isBonded,
      liquidityUSD: isBonded ? holderCount * 1000 : 0, // Placeholder calculation
    };
  } catch (error) {
    console.error("Failed to check bonding status:", error);
    return { isBonded: false };
  }
}

/**
 * Detect if a token has been rugged or abandoned
 */
export async function detectRugPull(tokenAddress: string, launchDate: Date): Promise<{
  isRugged: boolean;
  reason?: string;
}> {
  try {
    // Get recent activity
    const signatures = await getSignaturesForAddress(tokenAddress, 50);
    
    if (signatures.length === 0) {
      const daysSinceLaunch = (Date.now() - launchDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLaunch > 7) {
        return {
          isRugged: true,
          reason: "No activity for 7+ days after launch",
        };
      }
    }

    // Check for suspicious patterns (large transfers to single wallet)
    for (const sig of signatures.slice(0, 10)) {
      const transaction = await getTransaction(sig.signature);
      
      if (!transaction) continue;

      // Look for large withdrawals
      const hasLargeWithdrawal = transaction.meta.postBalances.some(
        (balance, index) => {
          const preBalance = transaction.meta.preBalances[index];
          const diff = balance - preBalance;
          return diff < -1000000000; // 1 SOL or more withdrawn
        }
      );

      if (hasLargeWithdrawal) {
        return {
          isRugged: true,
          reason: "Large withdrawal detected",
        };
      }
    }

    return { isRugged: false };
  } catch (error) {
    console.error("Failed to detect rug pull:", error);
    return { isRugged: false };
  }
}

/**
 * Scan for new token launches across the network
 * This would typically be run as a background job
 */
export async function scanForNewLaunches(): Promise<any[]> {
  // This is a placeholder - in production, you'd use Helius webhooks or
  // continuously poll recent blocks for token creation events
  console.log("Scanning for new token launches...");
  
  // Example: Get recent block and analyze transactions
  const recentSlot = await makeRpcCall("getSlot", []);
  const block = await makeRpcCall("getBlock", [recentSlot, { encoding: "jsonParsed" }]);
  
  const launches: any[] = [];
  
  if (block && block.transactions) {
    for (const tx of block.transactions) {
      if (isTokenLaunchTransaction(tx)) {
        launches.push({
          signature: tx.transaction.signatures[0],
          slot: recentSlot,
          blockTime: block.blockTime,
        });
      }
    }
  }
  
  return launches;
}
