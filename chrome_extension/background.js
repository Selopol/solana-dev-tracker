/**
 * Padre Dev Intel - Background Service Worker
 * Handles real-time notifications for tracked developer launches
 */

const API_BASE_URL = 'https://solana-dev-tracker-production.up.railway.app/api/trpc';

// Polling interval (30 seconds)
const POLL_INTERVAL = 30000;

// Track last seen token to avoid duplicate notifications
let lastSeenTokenTimestamp = Date.now();

/**
 * Initialize background service
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('[DevIntel Background] Extension installed');
  
  // Set default settings
  chrome.storage.local.get(['notificationsEnabled', 'trackedDevelopers'], (result) => {
    if (result.notificationsEnabled === undefined) {
      chrome.storage.local.set({ notificationsEnabled: true });
    }
    if (!result.trackedDevelopers) {
      chrome.storage.local.set({ trackedDevelopers: [] });
    }
  });
  
  // Start polling
  startPolling();
});

/**
 * Start polling for new tokens
 */
function startPolling() {
  // Initial check
  checkForNewTokens();
  
  // Set up alarm for periodic checks
  chrome.alarms.create('checkNewTokens', { periodInMinutes: 0.5 }); // 30 seconds
}

/**
 * Handle alarm
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkNewTokens') {
    checkForNewTokens();
  }
});

/**
 * Check for new tokens from tracked developers
 */
async function checkForNewTokens() {
  try {
    // Get settings
    const { notificationsEnabled, trackedDevelopers } = await chrome.storage.local.get([
      'notificationsEnabled',
      'trackedDevelopers'
    ]);
    
    if (!notificationsEnabled || !trackedDevelopers || trackedDevelopers.length === 0) {
      return;
    }
    
    // Get recent events
    const response = await fetch(`${API_BASE_URL}/developer.getRecentEvents?input=${encodeURIComponent(JSON.stringify({ 
      limit: 50,
      since: lastSeenTokenTimestamp
    }))}`);
    
    if (!response.ok) {
      console.error('[DevIntel Background] API error:', response.status);
      return;
    }
    
    const data = await response.json();
    const events = data.result?.data || [];
    
    if (events.length === 0) return;
    
    // Update last seen timestamp
    lastSeenTokenTimestamp = Date.now();
    
    // Filter events for tracked developers
    const trackedWallets = new Set(trackedDevelopers.map(d => d.primaryWallet));
    
    for (const event of events) {
      if (trackedWallets.has(event.developerWallet)) {
        await showNotification(event);
      }
    }
  } catch (error) {
    console.error('[DevIntel Background] Error checking for new tokens:', error);
  }
}

/**
 * Show Chrome notification
 */
async function showNotification(event) {
  const { trackedDevelopers } = await chrome.storage.local.get(['trackedDevelopers']);
  const developer = trackedDevelopers.find(d => d.primaryWallet === event.developerWallet);
  
  const devName = developer?.twitterHandle 
    ? `@${developer.twitterHandle}` 
    : `${event.developerWallet.substring(0, 6)}...${event.developerWallet.slice(-4)}`;
  
  const title = event.type === 'migration' 
    ? `🚀 Token Migrated!` 
    : `🆕 New Token Launch`;
  
  const message = event.type === 'migration'
    ? `${devName} successfully migrated a token to Raydium!`
    : `${devName} launched a new token: ${event.tokenSymbol || 'Unknown'}`;
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    priority: 2,
    buttons: [
      { title: 'View on Padre' }
    ]
  });
  
  // Store notification for history
  const { notificationHistory = [] } = await chrome.storage.local.get(['notificationHistory']);
  notificationHistory.unshift({
    ...event,
    devName,
    title,
    message,
    timestamp: Date.now()
  });
  
  // Keep only last 50 notifications
  chrome.storage.local.set({ 
    notificationHistory: notificationHistory.slice(0, 50) 
  });
}

/**
 * Handle notification click
 */
chrome.notifications.onClicked.addListener((notificationId) => {
  // Open Padre terminal
  chrome.tabs.create({
    url: 'https://trade.padre.gg/trenches'
  });
});

/**
 * Handle notification button click
 */
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // View on Padre
    chrome.tabs.create({
      url: 'https://trade.padre.gg/trenches'
    });
  }
});

/**
 * Handle messages from popup/content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_NOTIFICATION_HISTORY') {
    chrome.storage.local.get(['notificationHistory'], (result) => {
      sendResponse({ history: result.notificationHistory || [] });
    });
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'TOGGLE_NOTIFICATIONS') {
    chrome.storage.local.set({ notificationsEnabled: message.enabled });
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === 'CHECK_NOW') {
    checkForNewTokens();
    sendResponse({ success: true });
    return true;
  }
});

console.log('[DevIntel Background] Service worker started');
