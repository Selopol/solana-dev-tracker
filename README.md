# Solana Developer Tracker

A comprehensive reputation tracking system for Solana token developers that integrates directly with the Padre trading terminal. The system monitors on-chain activity via Helius RPC and social presence via Twitter API to help traders identify trustworthy developers.

## Architecture

The project consists of two main components:

### 1. Backend Service (Node.js + tRPC)
- **Purpose**: Continuous data collection and API service
- **Deployment**: Railway (24/7 uptime)
- **Stack**: Express, tRPC, Drizzle ORM, MySQL
- **Data Sources**: Helius RPC (Solana), Twitter API

### 2. Chrome Extension
- **Purpose**: Display developer reputation in Padre terminal
- **Integration**: Injects floating panel into trade.padre.gg
- **Features**: Real-time developer lookup, reputation scoring, token history

## Features

### Developer Reputation Tracking
- **Migration Success Rate**: Percentage of tokens that successfully migrated from Pump.fun
- **Token Launch History**: Complete record of all tokens launched by a developer
- **Bonding Status**: Track which tokens achieved bonding vs failed
- **Failure Detection**: Identify rugged, abandoned, or failed tokens
- **Reputation Score**: Algorithmic score (0-100) based on track record

### Wallet Clustering
- **Multi-Wallet Detection**: Links multiple wallets belonging to the same developer
- **Transaction Pattern Analysis**: Identifies related wallets through on-chain activity
- **Confidence Scoring**: Rates the certainty of wallet associations

### Social Presence Tracking
- **Twitter Account Linking**: Associates Twitter profiles with developer wallets
- **Community Detection**: Identifies Twitter communities linked to tokens
- **Admin Resolution**: Finds community administrators and links them to developers

### Notification System
- **New Launch Alerts**: Get notified when tracked developers launch new tokens
- **Migration Alerts**: Know when a developer achieves a successful migration
- **Suspicious Pattern Detection**: Alerts for developers with multiple rug pulls

## Quick Start

### Prerequisites
- Node.js 22.x
- MySQL/TiDB database
- Helius RPC API key
- Twitter API credentials
- Railway account (for deployment)

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-username/solana-dev-tracker.git
cd solana-dev-tracker/solana_terminal_backend
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment variables**

Create a `.env` file with:
```env
DATABASE_URL=mysql://user:password@host:port/database
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
TWITTER_API_KEY=your_twitter_api_key
JWT_SECRET=your_jwt_secret
```

4. **Initialize database**
```bash
pnpm db:push
```

5. **Run development server**
```bash
pnpm dev
```

The API will be available at `http://localhost:3000/api/trpc`

### Chrome Extension Setup

1. **Navigate to extension directory**
```bash
cd chrome_extension
```

2. **Create icon assets**

Generate three PNG icons in the `assets` directory:
- `icon16.png` (16x16px)
- `icon48.png` (48x48px)
- `icon128.png` (128x128px)

Use the purple gradient theme (#8b5cf6 to #7c3aed) with Solana-related visuals.

3. **Update backend URL**

Edit `scripts/content.js` and `scripts/popup.js`:
```javascript
const API_BASE_URL = 'https://your-backend.railway.app/api/trpc';
```

4. **Load extension in Chrome**
- Open `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `chrome_extension` directory

5. **Test on Padre Terminal**
- Navigate to https://trade.padre.gg/trenches
- The developer tracker panel should appear automatically
- Panel detects tokens and displays developer reputation

## Deployment

### Deploy Backend to Railway

1. **Create Railway project**
```bash
railway login
railway init
```

2. **Add MySQL database**
```bash
railway add
# Select MySQL
```

3. **Set environment variables**

In Railway dashboard, add:
- `DATABASE_URL` (auto-provided by MySQL service)
- `HELIUS_RPC_URL`
- `TWITTER_API_KEY`
- `JWT_SECRET`

4. **Deploy**
```bash
railway up
```

5. **Run migrations**
```bash
railway run pnpm db:push
```

Your backend will be live at `https://your-project.railway.app`

### Update Extension with Production URL

After deployment, update the API URL in:
- `chrome_extension/scripts/content.js`
- `chrome_extension/scripts/popup.js`

Replace `https://your-backend-url.railway.app` with your actual Railway URL.

## API Documentation

### Base URL
```
https://your-backend.railway.app/api/trpc
```

### Key Endpoints

#### Get Developer by Wallet
```
GET /developers.getByWallet?input={"walletAddress":"WALLET_ADDRESS"}
```

#### Get Developer Profile
```
GET /developers.getProfile?input={"developerId":1}
```

#### Get Token by Address
```
GET /tokens.getByAddress?input={"tokenAddress":"TOKEN_ADDRESS"}
```

#### List Top Developers
```
GET /developers.list?input={"limit":50,"offset":0}
```

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## Data Collection

### Solana RPC Integration

The backend continuously monitors Solana blockchain via Helius RPC:

**Token Launch Detection**
- Monitors program logs for token creation events
- Extracts token metadata (name, symbol, supply)
- Links tokens to creator wallets

**Migration Tracking**
- Detects Pump.fun migration events
- Records migration timestamps and market caps
- Calculates success rates

**Bonding Status**
- Monitors bonding curve completion
- Tracks liquidity pool creation
- Identifies failed bonding attempts

### Twitter API Integration

Social presence tracking via Twitter API v2:

**Account Linking**
- Searches for wallet addresses in Twitter bios
- Matches token mentions to Twitter accounts
- Verifies account ownership

**Community Detection**
- Identifies Twitter communities linked to tokens
- Resolves community admin lists
- Links admins to developer wallets

## Scoring Algorithm

Developer reputation scores (0-100) are calculated using:

**Migration Success Rate (40%)**
- Percentage of tokens that achieved migration
- Higher weight for recent migrations

**Launch Volume (20%)**
- Total number of tokens launched
- Capped at 50 tokens to prevent spam inflation

**Success Ratio (30%)**
- Bonded tokens / total tokens
- Penalizes high failure rates

**Consistency (10%)**
- Inverse of failure rate
- Rewards developers with few rugs

## Chrome Extension Features

### Floating Panel
- **Auto-Detection**: Automatically detects tokens in Padre terminal
- **Draggable**: Reposition anywhere on screen
- **Minimizable**: Collapse to save space
- **Real-time Updates**: Refreshes data on token changes

### Developer Card
- **Reputation Badge**: Visual score indicator
- **Stats Grid**: Tokens, migrations, bonded, failed
- **Progress Bar**: Migration success rate visualization
- **Wallet Info**: Primary wallet address

### Popup Interface
- **Search**: Look up any wallet or token address
- **Watchlist**: Track favorite developers
- **Top Developers**: Browse highest-rated developers
- **Notifications**: Subscribe to developer alerts

## Development

### Project Structure

```
solana_terminal_backend/
├── server/
│   ├── routers.ts           # tRPC API endpoints
│   ├── developerDb.ts       # Database queries
│   ├── solanaService.ts     # Helius RPC client
│   ├── twitterService.ts    # Twitter API client
│   ├── scoringService.ts    # Reputation algorithm
│   └── notificationService.ts
├── drizzle/
│   └── schema.ts            # Database schema
├── client/
│   └── src/
│       └── pages/
│           └── Home.tsx     # API status page
└── shared/
    └── const.ts             # Shared constants

chrome_extension/
├── manifest.json            # Extension configuration
├── popup/
│   ├── popup.html          # Popup interface
│   ├── popup.css           # Popup styles
│   └── popup.js            # Popup logic
└── scripts/
    ├── content.js          # Padre integration
    └── background.js       # Background tasks
```

### Running Tests

```bash
cd solana_terminal_backend
pnpm test
```

Tests cover:
- Reputation scoring algorithm
- Migration rate calculations
- API endpoint responses
- Database queries

### Adding New Features

1. **Update Database Schema**
```typescript
// drizzle/schema.ts
export const newTable = mysqlTable("new_table", {
  id: int("id").autoincrement().primaryKey(),
  // ... fields
});
```

2. **Push Schema Changes**
```bash
pnpm db:push
```

3. **Add Database Helpers**
```typescript
// server/developerDb.ts
export async function getNewData() {
  const db = await getDb();
  return await db.select().from(newTable);
}
```

4. **Create tRPC Procedures**
```typescript
// server/routers.ts
newFeature: router({
  getData: publicProcedure.query(async () => {
    return await getNewData();
  }),
}),
```

5. **Update Extension**
```javascript
// chrome_extension/scripts/popup.js
const response = await fetch(`${API_BASE_URL}/newFeature.getData`);
```

## Troubleshooting

### Backend Issues

**Database Connection Errors**
- Verify `DATABASE_URL` is correct
- Check database server is running
- Ensure SSL is enabled for remote connections

**RPC Rate Limiting**
- Implement request throttling
- Use multiple RPC endpoints
- Upgrade Helius plan

**Twitter API Errors**
- Verify API credentials are valid
- Check rate limit status
- Use API v2 endpoints only

### Extension Issues

**Panel Not Appearing**
- Check console for errors (`F12`)
- Verify extension is loaded (`chrome://extensions/`)
- Confirm you're on `trade.padre.gg`
- Check content script permissions

**No Developer Data**
- Verify backend URL is correct
- Check CORS configuration
- Ensure token address is valid
- Review network tab for API errors

**Token Detection Failing**
- Inspect Padre DOM structure
- Update selector patterns in `content.js`
- Check URL pattern matching
- Review console logs

## Security

### API Security
- All endpoints use HTTPS
- Rate limiting enabled
- Input validation via Zod schemas
- SQL injection protection via Drizzle ORM

### Extension Security
- Content Security Policy enforced
- No eval() or inline scripts
- Minimal permissions requested
- Secure storage API for sensitive data

### Data Privacy
- No personal data collection
- No browsing history tracking
- No data sharing with third parties
- Local storage only

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Write tests for new features

## License

MIT License - see [LICENSE](LICENSE) for details

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact the maintainers
- Check existing documentation

## Roadmap

### Planned Features
- [ ] Historical reputation tracking
- [ ] Developer comparison tool
- [ ] Advanced filtering options
- [ ] Export data to CSV
- [ ] Mobile app version
- [ ] Additional DEX integrations

### Future Integrations
- [ ] Jupiter aggregator
- [ ] Raydium DEX
- [ ] Orca DEX
- [ ] Pump.fun direct integration

## Acknowledgments

- **Helius** for Solana RPC infrastructure
- **Twitter** for social data API
- **Padre** for trading terminal platform
- **Pump.fun** for memecoin launch data

---

**Built for transparency in Solana memecoin trading**
