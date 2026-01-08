// Background service worker for Solana Developer Tracker
// Handles background tasks and data synchronization

const API_BASE_URL = 'https://3000-idpi1nb1k0zpeibs9apmo-a17bffb6.us2.manus.computer/api/trpc';

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Solana Developer Tracker installed');
  
  // Initialize storage
  chrome.storage.local.set({
    lastSync: Date.now(),
    watchlist: [],
    notifications: []
  });
});

// Periodic sync (every 5 minutes)
chrome.alarms.create('syncData', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncData') {
    syncWatchlistData();
  }
});

// Sync watchlist data
async function syncWatchlistData() {
  try {
    const { watchlist } = await chrome.storage.local.get('watchlist');
    
    if (!watchlist || watchlist.length === 0) {
      return;
    }

    // Check for updates on watched developers
    for (const developerId of watchlist) {
      await checkDeveloperUpdates(developerId);
    }

    // Update last sync time
    await chrome.storage.local.set({ lastSync: Date.now() });
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Check for developer updates
async function checkDeveloperUpdates(developerId) {
  try {
    const response = await fetch(`${API_BASE_URL}/developers.getProfile?input=${encodeURIComponent(JSON.stringify({ developerId }))}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const profile = data.result.data;

    // Check for new tokens
    const { lastTokenCount } = await chrome.storage.local.get(`dev_${developerId}_lastTokenCount`);
    
    if (lastTokenCount && profile.totalTokensLaunched > lastTokenCount) {
      // New token launched
      sendNotification({
        title: 'New Token Launch',
        message: `${profile.displayName || 'Developer'} launched a new token!`,
        developerId: developerId
      });
    }

    // Update stored token count
    await chrome.storage.local.set({
      [`dev_${developerId}_lastTokenCount`]: profile.totalTokensLaunched
    });
  } catch (error) {
    console.error('Check updates error:', error);
  }
}

// Send notification
function sendNotification(data) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../assets/icon128.png',
    title: data.title,
    message: data.message,
    priority: 2
  });

  // Store notification
  chrome.storage.local.get('notifications', (result) => {
    const notifications = result.notifications || [];
    notifications.unshift({
      ...data,
      timestamp: Date.now()
    });
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.length = 50;
    }
    
    chrome.storage.local.set({ notifications });
  });
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addToWatchlist') {
    addToWatchlist(request.developerId).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'removeFromWatchlist') {
    removeFromWatchlist(request.developerId).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'getNotifications') {
    chrome.storage.local.get('notifications', (result) => {
      sendResponse({ notifications: result.notifications || [] });
    });
    return true;
  }
});

// Watchlist management
async function addToWatchlist(developerId) {
  const { watchlist } = await chrome.storage.local.get('watchlist');
  const updatedWatchlist = watchlist || [];
  
  if (!updatedWatchlist.includes(developerId)) {
    updatedWatchlist.push(developerId);
    await chrome.storage.local.set({ watchlist: updatedWatchlist });
  }
}

async function removeFromWatchlist(developerId) {
  const { watchlist } = await chrome.storage.local.get('watchlist');
  const updatedWatchlist = (watchlist || []).filter(id => id !== developerId);
  await chrome.storage.local.set({ watchlist: updatedWatchlist });
}
