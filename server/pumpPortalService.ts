/**
 * PumpPortal WebSocket Service
 * Real-time monitoring of new tokens and migrations
 */

import WebSocket from 'ws';

const PUMPPORTAL_WS_URL = 'wss://pumpportal.fun/api/data';
const PUMPPORTAL_API_KEY = 'b1a68e3fcxq58wub9n65at3dah3kjy3ccn976tb4atpngpkt69n5jjk3at474t2h8hv64dtb6rwkau2bc9770n2e61450k35dn9n0duhctc4ukaf6972ymkdcd65cj278x4kavuccwykuarv32tbfcxq6gnb2a0un4kuh8cdxrpgcv970u62ka6cmu74h2n75vpueapdx0kuf8';

export interface NewTokenEvent {
  signature: string;
  mint: string;
  traderPublicKey: string; // This is the CREATOR
  txType: 'create';
  initialBuy: number;
  solAmount: number;
  bondingCurveKey: string;
  vTokensInBondingCurve: number;
  vSolInBondingCurve: number;
  marketCapSol: number;
  name: string;
  symbol: string;
  uri: string;
  pool: string;
}

export interface MigrationEvent {
  signature: string;
  mint: string;
  txType: 'migration';
  pool?: string;
  // Additional fields may be present
}

export interface TradeEvent {
  signature: string;
  mint: string;
  traderPublicKey: string;
  txType: 'buy' | 'sell';
  tokenAmount: number;
  solAmount: number;
  bondingCurveKey: string;
  vTokensInBondingCurve: number;
  vSolInBondingCurve: number;
  marketCapSol: number;
  newTokenBalance: number;
  pool: string;
}

type EventCallback = (event: NewTokenEvent | MigrationEvent | TradeEvent) => void;

let ws: WebSocket | null = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 5000;

const eventCallbacks: {
  newToken: EventCallback[];
  migration: EventCallback[];
  trade: EventCallback[];
} = {
  newToken: [],
  migration: [],
  trade: []
};

// Store creator mappings: tokenMint -> creatorWallet
const creatorCache = new Map<string, string>();

/**
 * Get creator wallet for a token from cache
 */
export function getTokenCreator(tokenMint: string): string | undefined {
  return creatorCache.get(tokenMint);
}

/**
 * Set creator wallet for a token in cache
 */
export function setTokenCreator(tokenMint: string, creatorWallet: string): void {
  creatorCache.set(tokenMint, creatorWallet);
}

/**
 * Connect to PumpPortal WebSocket
 */
export function connectPumpPortal(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isConnected && ws) {
      console.log('[PumpPortal] Already connected');
      resolve();
      return;
    }

    // Use API key for PumpSwap data (requires funded wallet)
    // For basic data (new tokens), no API key needed
    const wsUrl = PUMPPORTAL_WS_URL;
    
    console.log('[PumpPortal] Connecting to WebSocket...');
    
    ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log('[PumpPortal] ✅ WebSocket connected');
      isConnected = true;
      reconnectAttempts = 0;

      // Subscribe to new token events (includes creator info)
      const subscribeNewToken = {
        method: 'subscribeNewToken'
      };
      ws?.send(JSON.stringify(subscribeNewToken));
      console.log('[PumpPortal] Subscribed to new token events');

      // Subscribe to migration events
      const subscribeMigration = {
        method: 'subscribeMigration'
      };
      ws?.send(JSON.stringify(subscribeMigration));
      console.log('[PumpPortal] Subscribed to migration events');

      resolve();
    });

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle subscription confirmations
        if (message.message) {
          console.log(`[PumpPortal] ${message.message}`);
          return;
        }

        // Handle errors
        if (message.errors) {
          console.warn(`[PumpPortal] Warning: ${message.errors}`);
          return;
        }

        // Process events based on txType
        if (message.txType === 'create') {
          const event = message as NewTokenEvent;
          
          // Cache the creator
          creatorCache.set(event.mint, event.traderPublicKey);
          console.log(`[PumpPortal] New token: ${event.symbol} (${event.mint.substring(0, 8)}...) by ${event.traderPublicKey.substring(0, 8)}...`);
          
          // Notify callbacks
          eventCallbacks.newToken.forEach(cb => cb(event));
          
        } else if (message.txType === 'migration') {
          const event = message as MigrationEvent;
          console.log(`[PumpPortal] Migration: ${event.mint.substring(0, 8)}...`);
          
          // Notify callbacks
          eventCallbacks.migration.forEach(cb => cb(event));
          
        } else if (message.txType === 'buy' || message.txType === 'sell') {
          const event = message as TradeEvent;
          
          // Notify callbacks (if any)
          eventCallbacks.trade.forEach(cb => cb(event));
        }
      } catch (error) {
        console.error('[PumpPortal] Error parsing message:', error);
      }
    });

    ws.on('error', (error: Error) => {
      console.error('[PumpPortal] WebSocket error:', error);
      reject(error);
    });

    ws.on('close', () => {
      console.log('[PumpPortal] WebSocket disconnected');
      isConnected = false;
      ws = null;

      // Attempt to reconnect
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`[PumpPortal] Reconnecting in ${RECONNECT_DELAY / 1000}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        setTimeout(() => {
          connectPumpPortal().catch(console.error);
        }, RECONNECT_DELAY);
      } else {
        console.error('[PumpPortal] Max reconnect attempts reached');
      }
    });
  });
}

/**
 * Disconnect from PumpPortal WebSocket
 */
export function disconnectPumpPortal(): void {
  if (ws) {
    ws.close();
    ws = null;
    isConnected = false;
    console.log('[PumpPortal] Disconnected');
  }
}

/**
 * Register callback for new token events
 */
export function onNewToken(callback: (event: NewTokenEvent) => void): void {
  eventCallbacks.newToken.push(callback as EventCallback);
}

/**
 * Register callback for migration events
 */
export function onMigration(callback: (event: MigrationEvent) => void): void {
  eventCallbacks.migration.push(callback as EventCallback);
}

/**
 * Register callback for trade events
 */
export function onTrade(callback: (event: TradeEvent) => void): void {
  eventCallbacks.trade.push(callback as EventCallback);
}

/**
 * Check if connected
 */
export function isPumpPortalConnected(): boolean {
  return isConnected;
}

/**
 * Get cache size
 */
export function getCreatorCacheSize(): number {
  return creatorCache.size;
}
