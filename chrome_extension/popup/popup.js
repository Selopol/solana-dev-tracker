/**
 * Padre Dev Intel - Popup Script
 * Top devs hub with search, rankings, and tracking
 */

const API_BASE_URL = 'https://solana-dev-tracker-production.up.railway.app/api/trpc';

// State
let currentDeveloper = null;
let trackedDevelopers = [];

// DOM Elements
const elements = {
  statusDot: null,
  statusText: null,
  tabs: null,
  searchInput: null,
  searchBtn: null,
  loadingState: null,
  errorState: null,
  developerProfile: null,
  emptySearch: null,
  topDevsLoading: null,
  topDevsList: null,
  topDevsEmpty: null,
  trackedList: null,
  trackedEmpty: null,
  sortBy: null
};

/**
 * Initialize popup
 */
document.addEventListener('DOMContentLoaded', () => {
  initElements();
  initTabs();
  initSearch();
  initSorting();
  checkApiStatus();
  loadTrackedDevelopers();
  loadTopDevelopers();
});

/**
 * Initialize DOM element references
 */
function initElements() {
  elements.statusDot = document.querySelector('.status-dot');
  elements.statusText = document.getElementById('statusText');
  elements.tabs = document.querySelectorAll('.tab');
  elements.searchInput = document.getElementById('searchInput');
  elements.searchBtn = document.getElementById('searchBtn');
  elements.loadingState = document.getElementById('loadingState');
  elements.errorState = document.getElementById('errorState');
  elements.developerProfile = document.getElementById('developerProfile');
  elements.emptySearch = document.getElementById('emptySearch');
  elements.topDevsLoading = document.getElementById('topDevsLoading');
  elements.topDevsList = document.getElementById('topDevsList');
  elements.topDevsEmpty = document.getElementById('topDevsEmpty');
  elements.trackedList = document.getElementById('trackedList');
  elements.trackedEmpty = document.getElementById('trackedEmpty');
  elements.sortBy = document.getElementById('sortBy');
}

/**
 * Initialize tab switching
 */
function initTabs() {
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      
      // Update tab buttons
      elements.tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update tab content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`${tabId}Tab`).classList.add('active');
      
      // Load data for specific tabs
      if (tabId === 'top') {
        loadTopDevelopers();
      } else if (tabId === 'tracked') {
        renderTrackedDevelopers();
      }
    });
  });
}

/**
 * Initialize search functionality
 */
function initSearch() {
  elements.searchBtn.addEventListener('click', performSearch);
  elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });
  
  document.getElementById('retryBtn')?.addEventListener('click', performSearch);
  document.getElementById('trackBtn')?.addEventListener('click', trackCurrentDeveloper);
}

/**
 * Initialize sorting
 */
function initSorting() {
  elements.sortBy?.addEventListener('change', loadTopDevelopers);
}

/**
 * Check API status
 */
async function checkApiStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/developer.getTopDevelopers?input=${encodeURIComponent(JSON.stringify({ limit: 1 }))}`);
    if (response.ok) {
      elements.statusDot.classList.add('connected');
      elements.statusText.textContent = 'Connected';
    } else {
      throw new Error('API not responding');
    }
  } catch (error) {
    elements.statusDot.classList.remove('connected');
    elements.statusText.textContent = 'Offline';
  }
}

/**
 * Perform search
 */
async function performSearch() {
  const query = elements.searchInput.value.trim();
  if (!query) return;
  
  // Show loading
  elements.emptySearch.classList.add('hidden');
  elements.developerProfile.classList.add('hidden');
  elements.errorState.classList.add('hidden');
  elements.loadingState.classList.remove('hidden');
  
  try {
    // Try searching by wallet first
    let response = await fetch(`${API_BASE_URL}/developer.getByWallet?input=${encodeURIComponent(JSON.stringify({ wallet: query }))}`);
    let data = await response.json();
    let developer = data.result?.data;
    
    // If not found, try by token
    if (!developer) {
      response = await fetch(`${API_BASE_URL}/developer.getByToken?input=${encodeURIComponent(JSON.stringify({ tokenMint: query }))}`);
      data = await response.json();
      developer = data.result?.data;
    }
    
    if (developer) {
      currentDeveloper = developer;
      renderDeveloperProfile(developer);
    } else {
      showError('Developer not found. Try a different wallet or token address.');
    }
  } catch (error) {
    console.error('Search error:', error);
    showError('Failed to search. Please try again.');
  }
  
  elements.loadingState.classList.add('hidden');
}

/**
 * Render developer profile
 */
function renderDeveloperProfile(dev) {
  elements.developerProfile.classList.remove('hidden');
  elements.emptySearch.classList.add('hidden');
  
  // Name
  const devName = document.getElementById('devName');
  devName.textContent = dev.twitterHandle ? `@${dev.twitterHandle}` : 'Developer';
  
  // Wallet
  const devWallet = document.getElementById('devWallet');
  devWallet.textContent = `${dev.primaryWallet.substring(0, 8)}...${dev.primaryWallet.slice(-6)}`;
  
  // Twitter
  const devTwitter = document.getElementById('devTwitter');
  const twitterHandle = document.getElementById('twitterHandle');
  if (dev.twitterHandle) {
    devTwitter.classList.remove('hidden');
    devTwitter.href = `https://twitter.com/${dev.twitterHandle}`;
    twitterHandle.textContent = `@${dev.twitterHandle}`;
  } else {
    devTwitter.classList.add('hidden');
  }
  
  // Score
  const reputationScore = document.getElementById('reputationScore');
  reputationScore.textContent = `${dev.migrationSuccessRate}%`;
  
  // Stats
  document.getElementById('totalTokens').textContent = dev.totalTokensLaunched;
  document.getElementById('migratedTokens').textContent = dev.migratedTokens;
  document.getElementById('bondedTokens').textContent = dev.bondedTokens || 0;
  document.getElementById('failedTokens').textContent = dev.totalTokensLaunched - dev.migratedTokens;
  
  // Progress bar
  const migrationRate = document.getElementById('migrationRate');
  const migrationProgress = document.getElementById('migrationProgress');
  migrationRate.textContent = `${dev.migrationSuccessRate}%`;
  migrationProgress.style.width = `${dev.migrationSuccessRate}%`;
  
  // Color based on rate
  migrationProgress.classList.remove('high', 'medium', 'low');
  if (dev.migrationSuccessRate >= 70) {
    migrationProgress.classList.add('high');
  } else if (dev.migrationSuccessRate >= 40) {
    migrationProgress.classList.add('medium');
  } else {
    migrationProgress.classList.add('low');
  }
  
  // Update track button
  const trackBtn = document.getElementById('trackBtn');
  const isTracked = trackedDevelopers.some(d => d.primaryWallet === dev.primaryWallet);
  if (isTracked) {
    trackBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      Tracked
    `;
    trackBtn.style.opacity = '0.7';
  } else {
    trackBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Track Developer
    `;
    trackBtn.style.opacity = '1';
  }
}

/**
 * Show error message
 */
function showError(message) {
  elements.errorState.classList.remove('hidden');
  elements.errorState.querySelector('.error-message').textContent = message;
}

/**
 * Load top developers
 */
async function loadTopDevelopers() {
  const sortBy = elements.sortBy?.value || 'migration_rate';
  
  elements.topDevsLoading.classList.remove('hidden');
  elements.topDevsList.classList.add('hidden');
  elements.topDevsEmpty.classList.add('hidden');
  
  try {
    const response = await fetch(`${API_BASE_URL}/developer.getTopDevelopers?input=${encodeURIComponent(JSON.stringify({ 
      limit: 20,
      sortBy: sortBy
    }))}`);
    
    const data = await response.json();
    const developers = data.result?.data || [];
    
    if (developers.length > 0) {
      renderDevelopersList(elements.topDevsList, developers);
      elements.topDevsList.classList.remove('hidden');
    } else {
      elements.topDevsEmpty.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Failed to load top developers:', error);
    elements.topDevsEmpty.classList.remove('hidden');
  }
  
  elements.topDevsLoading.classList.add('hidden');
}

/**
 * Render developers list
 */
function renderDevelopersList(container, developers) {
  container.innerHTML = developers.map((dev, index) => {
    const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
    const rateClass = dev.migrationSuccessRate >= 70 ? '' : dev.migrationSuccessRate >= 40 ? 'medium' : 'low';
    const name = dev.twitterHandle ? `@${dev.twitterHandle}` : `${dev.primaryWallet.substring(0, 6)}...${dev.primaryWallet.slice(-4)}`;
    
    return `
      <div class="dev-list-item" data-wallet="${dev.primaryWallet}">
        <div class="dev-rank ${rankClass}">${index + 1}</div>
        <div class="dev-list-info">
          <div class="dev-list-name">${name}</div>
          <div class="dev-list-stats">${dev.migratedTokens}/${dev.totalTokensLaunched} migrated</div>
        </div>
        <div class="dev-list-rate ${rateClass}">${dev.migrationSuccessRate}%</div>
      </div>
    `;
  }).join('');
  
  // Add click handlers
  container.querySelectorAll('.dev-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const wallet = item.dataset.wallet;
      elements.searchInput.value = wallet;
      
      // Switch to search tab
      elements.tabs.forEach(t => t.classList.remove('active'));
      document.querySelector('[data-tab="search"]').classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById('searchTab').classList.add('active');
      
      performSearch();
    });
  });
}

/**
 * Track current developer
 */
function trackCurrentDeveloper() {
  if (!currentDeveloper) return;
  
  const isTracked = trackedDevelopers.some(d => d.primaryWallet === currentDeveloper.primaryWallet);
  
  if (isTracked) {
    // Untrack
    trackedDevelopers = trackedDevelopers.filter(d => d.primaryWallet !== currentDeveloper.primaryWallet);
  } else {
    // Track
    trackedDevelopers.push({
      primaryWallet: currentDeveloper.primaryWallet,
      twitterHandle: currentDeveloper.twitterHandle,
      migrationSuccessRate: currentDeveloper.migrationSuccessRate,
      totalTokensLaunched: currentDeveloper.totalTokensLaunched,
      migratedTokens: currentDeveloper.migratedTokens
    });
  }
  
  // Save to storage
  chrome.storage.local.set({ trackedDevelopers });
  
  // Update UI
  renderDeveloperProfile(currentDeveloper);
}

/**
 * Load tracked developers from storage
 */
function loadTrackedDevelopers() {
  chrome.storage.local.get(['trackedDevelopers'], (result) => {
    trackedDevelopers = result.trackedDevelopers || [];
    renderTrackedDevelopers();
  });
}

/**
 * Render tracked developers
 */
function renderTrackedDevelopers() {
  if (trackedDevelopers.length === 0) {
    elements.trackedList.classList.add('hidden');
    elements.trackedEmpty.classList.remove('hidden');
    return;
  }
  
  elements.trackedEmpty.classList.add('hidden');
  elements.trackedList.classList.remove('hidden');
  
  renderDevelopersList(elements.trackedList, trackedDevelopers);
}
