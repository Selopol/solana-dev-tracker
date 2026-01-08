// API Configuration
const API_BASE_URL = 'https://3000-idpi1nb1k0zpeibs9apmo-a17bffb6.us2.manus.computer/api/trpc';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const developerProfile = document.getElementById('developerProfile');
const topDevelopers = document.getElementById('topDevelopers');
const retryBtn = document.getElementById('retryBtn');
const subscribeBtn = document.getElementById('subscribeBtn');
const viewFullProfileBtn = document.getElementById('viewFullProfileBtn');

// State
let currentDeveloper = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTopDevelopers();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });
  refreshBtn.addEventListener('click', handleRefresh);
  retryBtn.addEventListener('click', handleRetry);
  subscribeBtn.addEventListener('click', handleSubscribe);
  viewFullProfileBtn.addEventListener('click', handleViewFullProfile);
}

// API Calls
async function fetchDeveloperByWallet(walletAddress) {
  const response = await fetch(`${API_BASE_URL}/developers.getByWallet?input=${encodeURIComponent(JSON.stringify({ walletAddress }))}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch developer');
  }

  const data = await response.json();
  return data.result.data;
}

async function fetchDeveloperProfile(developerId) {
  const response = await fetch(`${API_BASE_URL}/developers.getProfile?input=${encodeURIComponent(JSON.stringify({ developerId }))}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch developer profile');
  }

  const data = await response.json();
  return data.result.data;
}

async function fetchTopDevelopers() {
  const response = await fetch(`${API_BASE_URL}/developers.list?input=${encodeURIComponent(JSON.stringify({ limit: 10, offset: 0 }))}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch top developers');
  }

  const data = await response.json();
  return data.result.data;
}

// UI Handlers
async function handleSearch() {
  const query = searchInput.value.trim();
  
  if (!query) {
    showError('Please enter a wallet address or developer name');
    return;
  }

  showLoading();

  try {
    // Try to fetch by wallet address
    const developer = await fetchDeveloperByWallet(query);
    
    if (!developer) {
      showError('Developer not found');
      return;
    }

    // Fetch full profile
    const profile = await fetchDeveloperProfile(developer.id);
    displayDeveloperProfile(profile);
  } catch (error) {
    console.error('Search error:', error);
    showError('Failed to search developer. Please try again.');
  }
}

async function handleRefresh() {
  if (currentDeveloper) {
    showLoading();
    try {
      const profile = await fetchDeveloperProfile(currentDeveloper.id);
      displayDeveloperProfile(profile);
    } catch (error) {
      console.error('Refresh error:', error);
      showError('Failed to refresh data');
    }
  } else {
    loadTopDevelopers();
  }
}

function handleRetry() {
  if (currentDeveloper) {
    handleRefresh();
  } else {
    loadTopDevelopers();
  }
}

function handleSubscribe() {
  if (!currentDeveloper) return;
  
  // Open the web dashboard for subscription
  chrome.tabs.create({
    url: `https://3000-idpi1nb1k0zpeibs9apmo-a17bffb6.us2.manus.computer/`
  });
}

function handleViewFullProfile() {
  if (!currentDeveloper) return;
  
  // Open the web dashboard with developer profile
  chrome.tabs.create({
    url: `https://3000-idpi1nb1k0zpeibs9apmo-a17bffb6.us2.manus.computer/developer/${currentDeveloper.id}`
  });
}

async function loadTopDevelopers() {
  showLoading();

  try {
    const developers = await fetchTopDevelopers();
    displayTopDevelopers(developers);
  } catch (error) {
    console.error('Load top developers error:', error);
    showError('Failed to load top developers');
  }
}

// Display Functions
function displayDeveloperProfile(profile) {
  currentDeveloper = profile;

  // Update developer info
  document.getElementById('devName').textContent = profile.displayName || 'Unknown Developer';
  document.getElementById('devWallet').textContent = `Wallet: ${truncateAddress(profile.primaryWallet)}`;
  document.getElementById('reputationScore').textContent = profile.reputationScore;

  // Update stats
  document.getElementById('totalTokens').textContent = profile.totalTokensLaunched;
  document.getElementById('migratedTokens').textContent = profile.migratedTokens;
  document.getElementById('bondedTokens').textContent = profile.bondedTokens;
  document.getElementById('failedTokens').textContent = profile.failedTokens;

  // Update migration rate
  const migrationRate = profile.migrationSuccessRate;
  document.getElementById('migrationRate').textContent = `${migrationRate}%`;
  document.getElementById('migrationProgress').style.width = `${migrationRate}%`;

  // Display Twitter accounts
  const twitterSection = document.getElementById('twitterSection');
  const twitterAccounts = document.getElementById('twitterAccounts');
  
  if (profile.twitterAccounts && profile.twitterAccounts.length > 0) {
    twitterSection.classList.remove('hidden');
    twitterAccounts.innerHTML = profile.twitterAccounts.map(account => `
      <a href="https://twitter.com/${account.twitterUsername}" target="_blank" class="twitter-account">
        <svg class="twitter-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
        <span class="twitter-username">@${account.twitterUsername}</span>
        ${account.verified ? '<svg class="verified-badge" viewBox="0 0 24 24" fill="currentColor"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/></svg>' : ''}
      </a>
    `).join('');
  } else {
    twitterSection.classList.add('hidden');
  }

  // Display token history
  const tokenList = document.getElementById('tokenList');
  if (profile.tokens && profile.tokens.length > 0) {
    tokenList.innerHTML = profile.tokens.slice(0, 10).map(token => `
      <div class="token-item ${token.status}">
        <div class="token-header">
          <span class="token-name">${token.name || 'Unknown Token'} (${token.symbol || 'N/A'})</span>
          <span class="token-status ${token.status}">${token.status}</span>
        </div>
        <div class="token-address">${truncateAddress(token.tokenAddress)}</div>
      </div>
    `).join('');
  } else {
    tokenList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No tokens found</p>';
  }

  // Show profile, hide others
  hideLoading();
  hideError();
  topDevelopers.classList.add('hidden');
  developerProfile.classList.remove('hidden');
}

function displayTopDevelopers(developers) {
  const developersList = document.getElementById('developersList');
  
  if (developers && developers.length > 0) {
    developersList.innerHTML = developers.map(dev => `
      <div class="developer-item" data-wallet="${dev.primaryWallet}">
        <div class="developer-item-info">
          <div class="developer-item-name">${dev.displayName || 'Unknown Developer'}</div>
          <div class="developer-item-stats">
            ${dev.totalTokensLaunched} tokens • ${dev.migrationSuccessRate}% success
          </div>
        </div>
        <div class="developer-item-score">${dev.reputationScore}</div>
      </div>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.developer-item').forEach(item => {
      item.addEventListener('click', async () => {
        const wallet = item.dataset.wallet;
        searchInput.value = wallet;
        await handleSearch();
      });
    });
  } else {
    developersList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No developers found</p>';
  }

  // Show top developers, hide others
  hideLoading();
  hideError();
  developerProfile.classList.add('hidden');
  topDevelopers.classList.remove('hidden');
}

// Utility Functions
function showLoading() {
  loadingState.classList.remove('hidden');
  errorState.classList.add('hidden');
  developerProfile.classList.add('hidden');
  topDevelopers.classList.add('hidden');
}

function hideLoading() {
  loadingState.classList.add('hidden');
}

function showError(message) {
  errorState.querySelector('.error-message').textContent = message;
  errorState.classList.remove('hidden');
  loadingState.classList.add('hidden');
  developerProfile.classList.add('hidden');
  topDevelopers.classList.add('hidden');
}

function hideError() {
  errorState.classList.add('hidden');
}

function truncateAddress(address) {
  if (!address) return 'N/A';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
