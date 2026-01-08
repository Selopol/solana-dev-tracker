/**
 * Moralis API Service
 * Fetches graduated Pump.fun tokens
 */

const MORALIS_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjhlMTFlNjEyLTNiMzUtNDAyMS04M2UxLWYwYWZiZWZmOWZkNyIsIm9yZ0lkIjoiNDg5MzA5IiwidXNlcklkIjoiNTAzNDQwIiwidHlwZUlkIjoiMmViNWQyNjEtMTg4MS00Mjc3LWJlYjAtMDBmYWVhNmUxZTUzIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3Njc4OTIzNzIsImV4cCI6NDkyMzY1MjM3Mn0.9AYBgfJ9NEQ-BVGCeD7oGlJftXm6T6LQPOBRZ28DI2A';
const MORALIS_BASE_URL = 'https://solana-gateway.moralis.io';

export interface GraduatedToken {
  tokenAddress: string;
  name: string;
  symbol: string;
  logo: string | null;
  decimals: string;
  priceNative: string;
  priceUsd: string;
  liquidity: string;
  fullyDilutedValuation: string;
  graduatedAt: string;
}

export interface MoralisGraduatedResponse {
  result: GraduatedToken[];
  cursor?: string;
}

/**
 * Fetch graduated tokens from Moralis
 */
export async function getGraduatedTokens(limit: number = 100, cursor?: string): Promise<MoralisGraduatedResponse> {
  try {
    let url = `${MORALIS_BASE_URL}/token/mainnet/exchange/pumpfun/graduated?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    console.log(`[Moralis] Fetching graduated tokens...`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'X-API-Key': MORALIS_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Moralis] API error: ${response.status} - ${errorText}`);
      return { result: [] };
    }

    const data = await response.json();
    console.log(`[Moralis] Fetched ${data.result?.length || 0} graduated tokens`);
    
    return data;
  } catch (error) {
    console.error('[Moralis] Error fetching graduated tokens:', error);
    return { result: [] };
  }
}

/**
 * Fetch all graduated tokens with pagination
 */
export async function getAllGraduatedTokens(maxTokens: number = 1000): Promise<GraduatedToken[]> {
  const allTokens: GraduatedToken[] = [];
  let cursor: string | undefined;
  
  while (allTokens.length < maxTokens) {
    const response = await getGraduatedTokens(100, cursor);
    
    if (response.result.length === 0) {
      break;
    }
    
    allTokens.push(...response.result);
    cursor = response.cursor;
    
    if (!cursor) {
      break;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`[Moralis] Total graduated tokens fetched: ${allTokens.length}`);
  return allTokens;
}

/**
 * Get token metadata from Moralis
 */
export async function getTokenMetadata(tokenAddress: string): Promise<any> {
  try {
    const url = `${MORALIS_BASE_URL}/token/mainnet/${tokenAddress}/metadata`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'X-API-Key': MORALIS_API_KEY
      }
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[Moralis] Error fetching token metadata:', error);
    return null;
  }
}

/**
 * Get token creator by finding the first swap (creator is the first buyer)
 */
export async function getTokenCreator(tokenAddress: string): Promise<string | null> {
  try {
    const url = `${MORALIS_BASE_URL}/token/mainnet/${tokenAddress}/swaps?limit=1&order=ASC`;

    console.log(`[Moralis] Fetching first swap for ${tokenAddress.substring(0, 8)}...`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'X-API-Key': MORALIS_API_KEY
      }
    });

    if (!response.ok) {
      console.error(`[Moralis] Error fetching first swap: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.result && data.result.length > 0) {
      const firstSwap = data.result[0];
      const creator = firstSwap.walletAddress;
      console.log(`[Moralis] Found creator for ${tokenAddress.substring(0, 8)}...: ${creator.substring(0, 8)}...`);
      return creator;
    }

    return null;
  } catch (error) {
    console.error('[Moralis] Error getting token creator:', error);
    return null;
  }
}

export async function getTokenBondingStatus(tokenAddress: string): Promise<{ mint: string; bondingProgress: number } | null> {
  try {
    const url = `${MORALIS_BASE_URL}/token/mainnet/${tokenAddress}/bonding-status`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'X-API-Key': MORALIS_API_KEY
      }
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[Moralis] Error fetching bonding status:', error);
    return null;
  }
}
