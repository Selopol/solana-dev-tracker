# Chrome Extension Installation Guide

## Overview

The Solana Developer Tracker Chrome Extension integrates directly with the Padre trading terminal to provide real-time developer reputation data. When you're trading on Padre, the extension automatically detects tokens and displays developer analytics in a floating panel.

## Installation Steps

### Step 1: Download the Extension

Download or clone the extension files:

```bash
git clone https://github.com/your-username/solana-dev-tracker.git
cd solana-dev-tracker/chrome_extension
```

### Step 2: Create Icon Assets

Before loading the extension, create three PNG icons in the `assets` directory:

- **icon16.png** - 16x16 pixels (toolbar icon)
- **icon48.png** - 48x48 pixels (extension management)
- **icon128.png** - 128x128 pixels (Chrome Web Store)

**Design Guidelines:**
- Use purple gradient theme (#8b5cf6 to #7c3aed)
- Include Solana-related visual elements (logo, blockchain symbols)
- Ensure icons are clear and recognizable at all sizes

### Step 3: Configure Backend URL

Edit the API endpoint in both script files:

**File: `scripts/content.js`**
```javascript
const API_BASE_URL = 'https://your-backend.railway.app/api/trpc';
```

**File: `scripts/popup.js`**
```javascript
const API_BASE_URL = 'https://your-backend.railway.app/api/trpc';
```

Replace `your-backend.railway.app` with your actual Railway deployment URL.

### Step 4: Load Extension in Chrome

1. Open Google Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `chrome_extension` directory
6. The extension icon should appear in your browser toolbar

### Step 5: Pin the Extension (Optional)

For quick access:

1. Click the puzzle piece icon in Chrome toolbar
2. Find "Solana Developer Tracker" in the list
3. Click the pin icon to keep it visible

## Using the Extension

### On Padre Trading Terminal

1. **Navigate to Padre**
   - Go to https://trade.padre.gg/trenches
   - Log in to your account

2. **Automatic Panel Injection**
   - The extension automatically injects a floating panel
   - Panel appears in the top-right corner
   - Dark theme matches Padre's interface

3. **Token Detection**
   - Panel automatically detects the current token
   - Fetches developer reputation data
   - Updates when you switch tokens

4. **Panel Controls**
   - **Drag**: Click and drag the header to reposition
   - **Minimize**: Click `-` button to collapse
   - **Refresh**: Click refresh icon to reload data
   - **Close**: Click `×` button to hide panel

### Popup Interface

Click the extension icon to open the popup:

**Features:**
- **Search**: Look up any wallet or token address
- **Current Token**: Shows data for token on Padre (if open)
- **Top Developers**: Browse highest-rated developers
- **Watchlist**: Track your favorite developers

## Features

### Floating Panel (Padre Integration)

**Developer Card:**
- Reputation score badge (0-100)
- Primary wallet address
- Token statistics (total, migrated, bonded, failed)
- Migration success rate with progress bar

**Real-time Updates:**
- Detects token changes automatically
- Refreshes data on demand
- Shows loading states during fetch

### Popup Window

**Search Functionality:**
- Search by wallet address
- Search by token address
- Instant results

**Developer Profiles:**
- Complete token launch history
- Twitter account links
- Notification subscription

## Troubleshooting

### Extension Not Loading

**Problem**: Extension fails to install

**Solutions:**
1. Verify all required files are present
2. Check that icon files exist in `assets` folder
3. Review Chrome extensions page for error messages
4. Try removing and re-adding the extension

### Panel Not Appearing on Padre

**Problem**: Floating panel doesn't show on Padre terminal

**Solutions:**
1. Verify you're on `https://trade.padre.gg/trenches`
2. Check extension is enabled in `chrome://extensions/`
3. Refresh the Padre page
4. Check browser console for errors (F12)
5. Verify content script permissions in manifest

### No Developer Data Displayed

**Problem**: Panel shows "No developer data found"

**Solutions:**
1. Verify backend service is running
2. Check API URL is correct in script files
3. Ensure token address is valid Solana address
4. Review network tab for API errors
5. Check CORS configuration on backend

### Token Not Detected

**Problem**: Panel doesn't detect current token

**Solutions:**
1. Check Padre DOM structure hasn't changed
2. Review console logs for detection errors
3. Manually search token address in popup
4. Update selector patterns in `content.js`

### API Connection Errors

**Problem**: "Failed to fetch" or network errors

**Solutions:**
1. Verify backend is deployed and running
2. Check Railway service status
3. Ensure CORS headers are configured
4. Verify host permissions in manifest.json
5. Check browser network tab for blocked requests

## Configuration

### Backend URL

Update in two files:

**scripts/content.js:**
```javascript
const API_BASE_URL = 'https://your-backend.railway.app/api/trpc';
```

**scripts/popup.js:**
```javascript
const API_BASE_URL = 'https://your-backend.railway.app/api/trpc';
```

### Permissions

The extension requires:

**storage** - Save watchlist and preferences locally
**activeTab** - Access current tab for token detection
**Host Permissions:**
- `https://trade.padre.gg/*` - Padre terminal access
- `https://*.railway.app/*` - Backend API access
- `https://mainnet.helius-rpc.com/*` - Solana RPC access

### Content Script Matching

Only runs on Padre terminal:

```json
"content_scripts": [
  {
    "matches": ["https://trade.padre.gg/*"],
    "js": ["scripts/content.js"],
    "run_at": "document_end"
  }
]
```

## Updating the Extension

After pulling new code:

1. Navigate to `chrome://extensions/`
2. Find "Solana Developer Tracker"
3. Click the refresh icon
4. Extension reloads with latest changes

For Chrome Web Store versions, updates install automatically.

## Privacy & Security

**Data Collection:**
- Extension does NOT collect personal information
- Does NOT track browsing history
- Does NOT share data with third parties
- Only communicates with configured backend API

**Local Storage:**
- Watchlist stored locally in browser
- Notification preferences stored locally
- No cloud sync or external storage

**Permissions:**
- Minimal permissions requested
- Only accesses Padre terminal pages
- No access to other websites
- Secure communication via HTTPS

## Development

### Modifying the Extension

1. Edit files in `chrome_extension` directory
2. Save changes
3. Reload extension in Chrome
4. Test on Padre terminal

**No build step required** - uses vanilla JavaScript.

### Testing

1. Open Padre terminal
2. Open browser console (F12)
3. Look for "[Solana Dev Tracker]" log messages
4. Test token detection and data fetching
5. Verify panel positioning and controls

### Debugging

**Console Logs:**
```javascript
[Solana Dev Tracker] Initializing on Padre terminal...
[Solana Dev Tracker] Panel injected successfully
[Solana Dev Tracker] Token detected from URL: <address>
[Solana Dev Tracker] Loading developer data...
```

**Common Issues:**
- Check network tab for API calls
- Verify token address extraction
- Review DOM element selection
- Test API endpoints directly

## Publishing to Chrome Web Store

### Preparation

1. **Create Store Assets**
   - 128x128 icon
   - 1280x800 promotional images
   - 440x280 small promotional tile
   - Screenshots of extension in action

2. **Update Manifest**
   - Set production backend URL
   - Increment version number
   - Add detailed description

3. **Create ZIP Package**
```bash
cd chrome_extension
zip -r solana-dev-tracker.zip . -x "*.git*" "*.DS_Store"
```

### Submission

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time $5 developer fee (if first submission)
3. Click "New Item"
4. Upload ZIP file
5. Fill in store listing details
6. Submit for review

**Review Time**: Typically 1-3 business days

### Post-Publication

- Monitor user reviews
- Respond to feedback
- Release updates as needed
- Track installation metrics

## Support

**Issues or Questions:**
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section
- Contact project maintainers

## Uninstallation

To remove the extension:

1. Navigate to `chrome://extensions/`
2. Find "Solana Developer Tracker"
3. Click **Remove**
4. Confirm removal

All local data (watchlist, preferences) will be deleted automatically.

---

**Ready to track Solana developer reputation in Padre!**
