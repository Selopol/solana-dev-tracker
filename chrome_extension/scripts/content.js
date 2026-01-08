/**
 * Content Script for Padre Terminal Integration
 * Injects developer reputation panel into Padre trading interface
 */

const API_BASE_URL = 'https://your-backend-url.railway.app/api/trpc';

// State
let currentTokenAddress = null;
let developerPanel = null;
let isInjected = false;

/**
 * Initialize extension when Padre terminal loads
 */
function init() {
  console.log('[Solana Dev Tracker] Initializing on Padre terminal...');
  
  // Wait for Padre terminal to fully load
  waitForElement('body', () => {
    injectDeveloperPanel();
    observeTokenChanges();
    setupMessageListener();
  });
}

/**
 * Wait for element to exist in DOM
 */
function waitForElement(selector, callback, maxAttempts = 50) {
  let attempts = 0;
  const interval = setInterval(() => {
    const element = document.querySelector(selector);
    if (element || attempts >= maxAttempts) {
      clearInterval(interval);
      if (element) callback(element);
    }
    attempts++;
  }, 100);
}

/**
 * Inject floating developer reputation panel
 */
function injectDeveloperPanel() {
  if (isInjected) return;

  // Create panel container
  developerPanel = document.createElement('div');
  developerPanel.id = 'solana-dev-tracker-panel';
  developerPanel.innerHTML = `
    <div class="sdt-panel">
      <div class="sdt-header">
        <div class="sdt-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Dev Tracker</span>
        </div>
        <div class="sdt-actions">
          <button class="sdt-btn-icon" id="sdt-refresh" title="Refresh">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.5 2V8H15.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2.5 22V16H8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19.13 8.5C18.4 6.5 16.9 4.8 15 3.7C13.1 2.6 10.9 2.2 8.8 2.6C6.7 3 4.8 4.1 3.5 5.8L2.5 7.5M21.5 16.5L20.5 18.2C19.2 19.9 17.3 21 15.2 21.4C13.1 21.8 10.9 21.4 9 20.3C7.1 19.2 5.6 17.5 4.87 15.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="sdt-btn-icon" id="sdt-minimize" title="Minimize">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="sdt-btn-icon" id="sdt-close" title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="sdt-content" id="sdt-content">
        <div class="sdt-loading">
          <div class="sdt-spinner"></div>
          <p>Detecting token...</p>
        </div>
      </div>
    </div>
  `;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = getPanelStyles();
  document.head.appendChild(style);

  // Append to body
  document.body.appendChild(developerPanel);
  isInjected = true;

  // Setup event listeners
  setupPanelEvents();

  console.log('[Solana Dev Tracker] Panel injected successfully');
}

/**
 * Get panel CSS styles
 */
function getPanelStyles() {
  return `
    #solana-dev-tracker-panel {
      position: fixed;
      top: 80px;
      right: 20px;
      width: 320px;
      max-height: 600px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .sdt-panel {
      background: #0a0a0f;
      border: 1px solid #27272a;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }

    .sdt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #18181b;
      border-bottom: 1px solid #27272a;
      cursor: move;
    }

    .sdt-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #fafafa;
      font-size: 14px;
      font-weight: 600;
    }

    .sdt-title svg {
      color: #a78bfa;
    }

    .sdt-actions {
      display: flex;
      gap: 4px;
    }

    .sdt-btn-icon {
      background: transparent;
      border: none;
      color: #a1a1aa;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, color 0.2s;
    }

    .sdt-btn-icon:hover {
      background: #27272a;
      color: #fafafa;
    }

    .sdt-content {
      padding: 16px;
      max-height: 500px;
      overflow-y: auto;
      color: #e4e4e7;
    }

    .sdt-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 32px;
      color: #a1a1aa;
      font-size: 13px;
    }

    .sdt-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #27272a;
      border-top-color: #a78bfa;
      border-radius: 50%;
      animation: sdt-spin 0.8s linear infinite;
    }

    @keyframes sdt-spin {
      to { transform: rotate(360deg); }
    }

    .sdt-dev-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .sdt-dev-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .sdt-dev-name {
      font-size: 14px;
      font-weight: 600;
      color: #fafafa;
      margin-bottom: 4px;
    }

    .sdt-dev-wallet {
      font-size: 10px;
      color: #71717a;
      font-family: monospace;
      word-break: break-all;
    }

    .sdt-score-badge {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
      color: white;
    }

    .sdt-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .sdt-stat {
      text-align: center;
      padding: 8px;
      background: #0a0a0f;
      border-radius: 6px;
    }

    .sdt-stat-value {
      font-size: 16px;
      font-weight: 600;
      color: #fafafa;
      margin-bottom: 2px;
    }

    .sdt-stat-label {
      font-size: 9px;
      color: #71717a;
      text-transform: uppercase;
    }

    .sdt-progress {
      margin-bottom: 12px;
    }

    .sdt-progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 6px;
    }

    .sdt-progress-label {
      color: #a1a1aa;
    }

    .sdt-progress-value {
      color: #fafafa;
      font-weight: 600;
    }

    .sdt-progress-bar {
      height: 6px;
      background: #27272a;
      border-radius: 3px;
      overflow: hidden;
    }

    .sdt-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%);
      transition: width 0.3s ease;
    }

    .sdt-empty {
      text-align: center;
      padding: 32px;
      color: #71717a;
      font-size: 13px;
    }

    .sdt-error {
      text-align: center;
      padding: 24px;
      color: #fca5a5;
      font-size: 13px;
      background: #7f1d1d20;
      border: 1px solid #7f1d1d;
      border-radius: 8px;
    }

    .sdt-content::-webkit-scrollbar {
      width: 6px;
    }

    .sdt-content::-webkit-scrollbar-track {
      background: #18181b;
    }

    .sdt-content::-webkit-scrollbar-thumb {
      background: #3f3f46;
      border-radius: 3px;
    }

    .sdt-minimized .sdt-content {
      display: none;
    }
  `;
}

/**
 * Setup panel event listeners
 */
function setupPanelEvents() {
  // Close button
  document.getElementById('sdt-close')?.addEventListener('click', () => {
    developerPanel.style.display = 'none';
  });

  // Minimize button
  document.getElementById('sdt-minimize')?.addEventListener('click', () => {
    developerPanel.querySelector('.sdt-panel').classList.toggle('sdt-minimized');
  });

  // Refresh button
  document.getElementById('sdt-refresh')?.addEventListener('click', () => {
    if (currentTokenAddress) {
      fetchDeveloperData(currentTokenAddress);
    }
  });

  // Make panel draggable
  makeDraggable(developerPanel.querySelector('.sdt-header'), developerPanel);
}

/**
 * Make element draggable
 */
function makeDraggable(handle, element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  handle.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
    element.style.right = 'auto';
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

/**
 * Observe token changes in Padre terminal
 */
function observeTokenChanges() {
  // Strategy 1: Watch URL changes
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      extractTokenFromUrl(url);
    }
  }).observe(document, { subtree: true, childList: true });

  // Strategy 2: Watch for token address elements in DOM
  const observer = new MutationObserver(() => {
    detectTokenAddress();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Initial check
  extractTokenFromUrl(location.href);
  detectTokenAddress();
}

/**
 * Extract token address from URL
 */
function extractTokenFromUrl(url) {
  // Common Solana address pattern (base58, 32-44 chars)
  const match = url.match(/([1-9A-HJ-NP-Za-km-z]{32,44})/);
  if (match && match[1] !== currentTokenAddress) {
    console.log('[Solana Dev Tracker] Token detected from URL:', match[1]);
    handleTokenChange(match[1]);
  }
}

/**
 * Detect token address in page content
 */
function detectTokenAddress() {
  // Look for Solana addresses in specific elements
  const selectors = [
    '[data-token-address]',
    '[data-mint]',
    '.token-address',
    '.mint-address'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const address = element.textContent || element.getAttribute('data-token-address') || element.getAttribute('data-mint');
      if (address && address.length >= 32 && address !== currentTokenAddress) {
        console.log('[Solana Dev Tracker] Token detected from DOM:', address);
        handleTokenChange(address);
        return;
      }
    }
  }
}

/**
 * Handle token address change
 */
function handleTokenChange(tokenAddress) {
  currentTokenAddress = tokenAddress;
  fetchDeveloperData(tokenAddress);
}

/**
 * Fetch developer data from backend
 */
async function fetchDeveloperData(tokenAddress) {
  const content = document.getElementById('sdt-content');
  if (!content) return;

  // Show loading
  content.innerHTML = `
    <div class="sdt-loading">
      <div class="sdt-spinner"></div>
      <p>Loading developer data...</p>
    </div>
  `;

  try {
    // Query token by address
    const response = await fetch(`${API_BASE_URL}/tokens.getByAddress?input=${encodeURIComponent(JSON.stringify({ tokenAddress }))}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch token data');
    }

    const data = await response.json();
    const token = data.result?.data;

    if (!token || !token.developerId) {
      showEmpty(content);
      return;
    }

    // Fetch developer profile
    const devResponse = await fetch(`${API_BASE_URL}/developers.getProfile?input=${encodeURIComponent(JSON.stringify({ developerId: token.developerId }))}`);
    const devData = await devResponse.json();
    const developer = devData.result?.data;

    if (developer) {
      renderDeveloperCard(content, developer);
    } else {
      showEmpty(content);
    }
  } catch (error) {
    console.error('[Solana Dev Tracker] Error fetching data:', error);
    showError(content, error.message);
  }
}

/**
 * Render developer card
 */
function renderDeveloperCard(container, developer) {
  container.innerHTML = `
    <div class="sdt-dev-card">
      <div class="sdt-dev-header">
        <div>
          <div class="sdt-dev-name">${developer.displayName || 'Unknown Developer'}</div>
          <div class="sdt-dev-wallet">${developer.primaryWallet}</div>
        </div>
        <div class="sdt-score-badge">${developer.reputationScore}</div>
      </div>
      <div class="sdt-stats">
        <div class="sdt-stat">
          <div class="sdt-stat-value">${developer.totalTokensLaunched}</div>
          <div class="sdt-stat-label">Tokens</div>
        </div>
        <div class="sdt-stat">
          <div class="sdt-stat-value">${developer.migratedTokens}</div>
          <div class="sdt-stat-label">Migrated</div>
        </div>
        <div class="sdt-stat">
          <div class="sdt-stat-value">${developer.bondedTokens}</div>
          <div class="sdt-stat-label">Bonded</div>
        </div>
        <div class="sdt-stat">
          <div class="sdt-stat-value">${developer.failedTokens}</div>
          <div class="sdt-stat-label">Failed</div>
        </div>
      </div>
      <div class="sdt-progress">
        <div class="sdt-progress-header">
          <span class="sdt-progress-label">Migration Rate</span>
          <span class="sdt-progress-value">${developer.migrationSuccessRate}%</span>
        </div>
        <div class="sdt-progress-bar">
          <div class="sdt-progress-fill" style="width: ${developer.migrationSuccessRate}%"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Show empty state
 */
function showEmpty(container) {
  container.innerHTML = `
    <div class="sdt-empty">
      <p>No developer data found for this token</p>
    </div>
  `;
}

/**
 * Show error state
 */
function showError(container, message) {
  container.innerHTML = `
    <div class="sdt-error">
      <p>Error: ${message}</p>
    </div>
  `;
}

/**
 * Setup message listener for communication with popup
 */
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getCurrentToken') {
      sendResponse({ tokenAddress: currentTokenAddress });
    }
    return true;
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
