/**
 * Padre Trenches Dev Intel - Content Script
 * Injects migration % badges into Padre token cards
 * Shows dev details popover on click
 */

const API_BASE_URL = 'https://solana-dev-tracker-production.up.railway.app/api/trpc';

// Cache for dev data to avoid repeated API calls
const devCache = new Map();
const CACHE_TTL = 60000; // 1 minute

// Track injected badges to avoid duplicates
const injectedBadges = new Set();

/**
 * Fetch dev info by token mint address
 */
async function fetchDevByToken(tokenMint) {
  // Check cache first
  const cached = devCache.get(tokenMint);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/developer.getByToken?input=${encodeURIComponent(JSON.stringify({ tokenMint }))}`);
    
    if (!response.ok) {
      console.error('[DevIntel] API error:', response.status);
      return null;
    }

    const result = await response.json();
    const data = result.result?.data;

    // Cache the result
    devCache.set(tokenMint, { data, timestamp: Date.now() });
    
    return data;
  } catch (error) {
    console.error('[DevIntel] Error fetching dev:', error);
    return null;
  }
}

/**
 * Create migration badge element
 */
function createMigrationBadge(migrationRate, totalTokens, migratedTokens) {
  const badge = document.createElement('div');
  badge.className = 'dev-intel-badge';
  
  // Color based on migration rate
  let badgeColor = '#ef4444'; // red for low
  if (migrationRate >= 70) badgeColor = '#22c55e'; // green for high
  else if (migrationRate >= 40) badgeColor = '#eab308'; // yellow for medium
  
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    background: ${badgeColor}20;
    color: ${badgeColor};
    border: 1px solid ${badgeColor}40;
    cursor: pointer;
    margin-left: 6px;
    transition: all 0.2s ease;
  `;
  
  badge.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
    ${migrationRate}% (${migratedTokens}/${totalTokens})
  `;
  
  badge.addEventListener('mouseenter', () => {
    badge.style.transform = 'scale(1.05)';
    badge.style.boxShadow = `0 2px 8px ${badgeColor}40`;
  });
  
  badge.addEventListener('mouseleave', () => {
    badge.style.transform = 'scale(1)';
    badge.style.boxShadow = 'none';
  });
  
  return badge;
}

/**
 * Create dev details popover
 */
function createDevPopover(devData) {
  const popover = document.createElement('div');
  popover.className = 'dev-intel-popover';
  
  popover.style.cssText = `
    position: fixed;
    z-index: 10000;
    background: #1a1a2e;
    border: 1px solid #2d2d44;
    border-radius: 12px;
    padding: 16px;
    min-width: 280px;
    max-width: 320px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #e4e4e7;
  `;
  
  const migrationColor = devData.migrationSuccessRate >= 70 ? '#22c55e' : 
                         devData.migrationSuccessRate >= 40 ? '#eab308' : '#ef4444';
  
  popover.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
      <div>
        <div style="font-size: 14px; font-weight: 600; color: #fff;">Dev Profile</div>
        ${devData.twitterHandle ? `
          <a href="https://twitter.com/${devData.twitterHandle}" target="_blank" 
             style="font-size: 12px; color: #8b5cf6; text-decoration: none;">
            @${devData.twitterHandle}
          </a>
        ` : '<span style="font-size: 12px; color: #71717a;">No Twitter linked</span>'}
      </div>
      <button class="close-popover" style="
        background: none;
        border: none;
        color: #71717a;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        line-height: 1;
      ">&times;</button>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
      <div style="background: #0f0f1a; padding: 10px; border-radius: 8px;">
        <div style="font-size: 10px; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">Migration Rate</div>
        <div style="font-size: 20px; font-weight: 700; color: ${migrationColor};">${devData.migrationSuccessRate}%</div>
      </div>
      <div style="background: #0f0f1a; padding: 10px; border-radius: 8px;">
        <div style="font-size: 10px; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">Total Tokens</div>
        <div style="font-size: 20px; font-weight: 700; color: #fff;">${devData.totalTokensLaunched}</div>
      </div>
    </div>
    
    <div style="background: #0f0f1a; padding: 10px; border-radius: 8px; margin-bottom: 12px;">
      <div style="font-size: 10px; color: #71717a; text-transform: uppercase; margin-bottom: 8px;">Stats Breakdown</div>
      <div style="display: flex; justify-content: space-between; font-size: 12px;">
        <span style="color: #22c55e;">✓ Migrated: ${devData.migratedTokens}</span>
        <span style="color: #ef4444;">✗ Failed: ${devData.totalTokensLaunched - devData.migratedTokens}</span>
      </div>
    </div>
    
    <div style="font-size: 11px; color: #71717a;">
      <div style="margin-bottom: 4px; word-break: break-all;">
        <span style="color: #52525b;">Wallet:</span> ${devData.primaryWallet.substring(0, 8)}...${devData.primaryWallet.slice(-6)}
      </div>
      ${devData.lastMigrationAt ? `
        <div>
          <span style="color: #52525b;">Last Migration:</span> ${new Date(devData.lastMigrationAt).toLocaleDateString()}
        </div>
      ` : ''}
    </div>
  `;
  
  // Close button handler
  popover.querySelector('.close-popover').addEventListener('click', () => {
    popover.remove();
  });
  
  // Close on click outside
  setTimeout(() => {
    document.addEventListener('click', function closePopover(e) {
      if (!popover.contains(e.target)) {
        popover.remove();
        document.removeEventListener('click', closePopover);
      }
    });
  }, 100);
  
  return popover;
}

/**
 * Show popover near the badge
 */
function showPopover(badge, devData) {
  // Remove any existing popovers
  document.querySelectorAll('.dev-intel-popover').forEach(p => p.remove());
  
  const popover = createDevPopover(devData);
  document.body.appendChild(popover);
  
  // Position near the badge
  const rect = badge.getBoundingClientRect();
  const popoverRect = popover.getBoundingClientRect();
  
  let left = rect.left;
  let top = rect.bottom + 8;
  
  // Adjust if off screen
  if (left + popoverRect.width > window.innerWidth) {
    left = window.innerWidth - popoverRect.width - 16;
  }
  if (top + popoverRect.height > window.innerHeight) {
    top = rect.top - popoverRect.height - 8;
  }
  
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
}

/**
 * Extract token mint from Padre page elements
 */
function extractTokenMint(element) {
  // Try to find token mint from various sources
  
  // 1. Check data attributes
  const dataToken = element.getAttribute('data-token') || 
                    element.getAttribute('data-mint') ||
                    element.getAttribute('data-address');
  if (dataToken && dataToken.length >= 32) return dataToken;
  
  // 2. Check href for token address
  const link = element.querySelector('a[href*="/token/"]') || 
               element.closest('a[href*="/token/"]');
  if (link) {
    const match = link.href.match(/\/token\/([A-Za-z0-9]{32,})/);
    if (match) return match[1];
  }
  
  // 3. Check for Solana address pattern in text
  const text = element.textContent || '';
  const addressMatch = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
  if (addressMatch) return addressMatch[0];
  
  // 4. Check URL for token
  const urlMatch = window.location.href.match(/[?&]token=([A-Za-z0-9]{32,})/);
  if (urlMatch) return urlMatch[1];
  
  return null;
}

/**
 * Inject badge into a token card
 */
async function injectBadge(tokenCard) {
  const tokenMint = extractTokenMint(tokenCard);
  if (!tokenMint) return;
  
  // Skip if already injected
  const badgeId = `badge-${tokenMint}`;
  if (injectedBadges.has(badgeId)) return;
  injectedBadges.add(badgeId);
  
  // Fetch dev data
  const devData = await fetchDevByToken(tokenMint);
  if (!devData) return;
  
  // Find a good place to inject the badge
  const titleElement = tokenCard.querySelector('h2, h3, .token-name, .name, [class*="title"]') ||
                       tokenCard.querySelector('span, div');
  
  if (!titleElement) return;
  
  // Create and inject badge
  const badge = createMigrationBadge(
    devData.migrationSuccessRate,
    devData.totalTokensLaunched,
    devData.migratedTokens
  );
  
  badge.setAttribute('data-token', tokenMint);
  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    showPopover(badge, devData);
  });
  
  titleElement.appendChild(badge);
  console.log(`[DevIntel] Injected badge for ${tokenMint.substring(0, 8)}...`);
}

/**
 * Scan page for token cards and inject badges
 */
function scanAndInject() {
  // Padre-specific selectors - adjust based on actual Padre DOM structure
  const tokenCards = document.querySelectorAll(`
    [class*="token-card"],
    [class*="TokenCard"],
    [class*="pair-card"],
    [class*="PairCard"],
    [class*="trade-row"],
    [class*="TradeRow"],
    tr[data-token],
    .token-item,
    .pair-item,
    article[class*="token"],
    div[class*="token"][class*="card"]
  `);
  
  tokenCards.forEach(card => {
    injectBadge(card);
  });
}

/**
 * Create floating panel for when no token cards found
 */
function createFloatingPanel() {
  // Check if panel already exists
  if (document.getElementById('dev-intel-panel')) return;
  
  const panel = document.createElement('div');
  panel.id = 'dev-intel-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%);
    border: 1px solid #2d2d44;
    border-radius: 12px;
    padding: 12px;
    min-width: 200px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #e4e4e7;
  `;
  
  panel.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
      <div style="
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <span style="font-size: 13px; font-weight: 600;">Dev Intel</span>
      <span style="font-size: 10px; color: #22c55e; margin-left: auto;">● Active</span>
    </div>
    <div style="font-size: 11px; color: #71717a;">
      Monitoring Padre for token cards...
    </div>
    <div id="dev-intel-status" style="font-size: 10px; color: #52525b; margin-top: 4px;">
      Badges: 0 injected
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Make panel draggable
  let isDragging = false;
  let startX, startY, startLeft, startBottom;
  
  panel.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = panel.offsetLeft;
    startBottom = window.innerHeight - panel.offsetTop - panel.offsetHeight;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    panel.style.right = 'auto';
    panel.style.left = `${startLeft + dx}px`;
    panel.style.bottom = `${startBottom - dy}px`;
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

/**
 * Update status in floating panel
 */
function updateStatus() {
  const status = document.getElementById('dev-intel-status');
  if (status) {
    status.textContent = `Badges: ${injectedBadges.size} injected`;
  }
}

/**
 * Initialize the extension
 */
function init() {
  console.log('[DevIntel] Initializing Padre Trenches Dev Intel...');
  
  // Create floating panel
  createFloatingPanel();
  
  // Initial scan
  scanAndInject();
  updateStatus();
  
  // Watch for DOM changes (new tokens loading)
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    
    if (shouldScan) {
      // Debounce scanning
      clearTimeout(window.devIntelScanTimeout);
      window.devIntelScanTimeout = setTimeout(() => {
        scanAndInject();
        updateStatus();
      }, 500);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Periodic scan every 5 seconds
  setInterval(() => {
    scanAndInject();
    updateStatus();
  }, 5000);
  
  console.log('[DevIntel] ✅ Initialized and monitoring');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
