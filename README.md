# Solana Developer Tracker

A comprehensive reputation tracking system for Solana token developers that monitors on-chain activity and social presence to help users identify trustworthy developers and make informed investment decisions.

## Overview

The Solana Developer Tracker is a transparent, open-source platform designed to provide comprehensive analytics on Solana token developers. The system continuously monitors blockchain activity via Helius RPC, tracks social presence through Twitter API, and calculates reputation scores based on migration success rates, token launch history, and bonding performance.

This project consists of three main components that work together to provide a complete developer reputation tracking solution:

1. **Backend Service** - A Node.js/Express server running 24/7 that collects and processes on-chain data
2. **Chrome Extension** - A browser extension providing quick access to developer analytics
3. **Web Dashboard** - An interactive web interface for exploring developer profiles and analytics

## Features

### Core Functionality

The platform tracks multiple dimensions of developer activity to build comprehensive reputation profiles. For each developer, the system monitors token launches across the Solana ecosystem, detecting when tokens migrate from platforms like Pump.fun to decentralized exchanges. The migration tracking system identifies successful bonding events and calculates success percentages that form the foundation of reputation scoring.

Wallet clustering algorithms identify multiple wallets belonging to the same developer by analyzing transaction patterns and shared token launches. This prevents reputation gaming through the use of multiple addresses and provides a more accurate picture of developer activity.

Social presence tracking links Twitter accounts and communities to developer wallets, adding credibility signals beyond pure on-chain metrics. The system resolves community administrators and tracks verified account status to enhance trust signals.

### Reputation Scoring

The reputation scoring algorithm considers four primary factors weighted by importance. Migration success rate contributes 40% of the total score, rewarding developers who successfully migrate tokens to established liquidity pools. Launch volume accounts for 20% of the score, recognizing experienced developers while capping the benefit to prevent gaming through excessive launches.

Success ratio comprises 30% of the score, calculated from the proportion of bonded tokens versus failed or abandoned projects. The consistency component makes up the final 10%, penalizing developers with patterns of multiple failures or suspicious activity.

### Real-time Monitoring

The backend service runs continuous monitoring jobs that scan for new token launches, detect migration events, and identify suspicious patterns such as rug pulls. When significant events occur, the notification system alerts subscribed users through the web dashboard and Chrome extension.

The monitoring system implements pattern detection algorithms that flag developers exhibiting concerning behavior, including high failure rates, multiple rug pulls, and rapid launch-and-abandon cycles. These alerts help users avoid potentially fraudulent projects before investing.

## Architecture

### System Components

The backend service operates as an Express.js application with tRPC endpoints for type-safe API communication. The database layer uses MySQL with Drizzle ORM for schema management and migrations. Background jobs run on scheduled intervals to collect blockchain data and update developer scores.

The Chrome extension provides a lightweight interface that queries the backend API to display developer information. Content scripts detect Solana wallet addresses on web pages and offer quick lookup functionality. The extension maintains a local watchlist and receives notifications for tracked developers.

The web dashboard presents an interactive interface built with React 19 and Tailwind CSS 4. The dashboard provides comprehensive developer profiles, analytics visualizations, and search functionality. Users can subscribe to notifications and explore historical token launch data through an intuitive interface.

### Data Flow

Data collection begins with the Solana RPC service continuously monitoring blockchain activity through Helius endpoints. The system detects token creation events, migration transactions, and bonding status changes. Transaction parsers extract relevant information and store it in the database.

The Twitter integration service runs parallel collection jobs that identify developer social accounts by analyzing tweet content for wallet addresses and token mentions. Community membership data enriches developer profiles with social credibility signals.

The scoring service processes collected data through wallet clustering algorithms and reputation calculation formulas. Updated scores propagate to the database and trigger notifications when significant changes occur. The API layer exposes this processed data through tRPC procedures consumed by the frontend applications.

## Technology Stack

### Backend Technologies

The server environment runs on Node.js 22 with TypeScript for type safety and Express 4 for HTTP routing. tRPC 11 provides end-to-end type safety between client and server without code generation. Drizzle ORM manages database schemas and migrations with full TypeScript support.

Data persistence uses MySQL/TiDB for relational data storage with efficient querying capabilities. The Helius RPC client provides enhanced Solana blockchain access with higher rate limits and better reliability than standard RPC endpoints. Axios handles HTTP requests to external APIs including Twitter.

### Frontend Technologies

The web dashboard builds on React 19 with Wouter for lightweight routing and TanStack Query for data fetching and caching. Tailwind CSS 4 provides utility-first styling with the new CSS-first configuration approach. shadcn/ui components deliver accessible, customizable UI elements.

The Chrome extension uses vanilla JavaScript for minimal bundle size and fast load times. The Manifest V3 specification ensures compatibility with modern Chrome security requirements. Background service workers handle periodic data synchronization and notification delivery.

### Development Tools

The development environment includes TypeScript 5.9 for static type checking and Vite 7 for fast development builds with hot module replacement. Vitest provides unit testing capabilities with a Jest-compatible API. ESLint and Prettier enforce code quality and consistent formatting.

## Installation and Setup

### Prerequisites

Before beginning installation, ensure your system has Node.js version 22 or higher installed. You will need access to a MySQL database instance, either local or cloud-hosted. Obtain a Helius RPC API key from the Helius developer portal for Solana blockchain access. Register a Twitter API application to receive API credentials for social data collection.

### Backend Setup

Clone the repository to your local machine and navigate to the project directory. Install dependencies using pnpm with the command `pnpm install`. Create a `.env` file in the project root based on the provided `.env.example` template.

Configure the database connection string in the `DATABASE_URL` environment variable. Set the `HELIUS_RPC_URL` to your Helius endpoint including the API key. Add your Twitter API credentials to the `TWITTER_API_KEY` variable.

Run database migrations using `pnpm db:push` to create the required tables and schema. Start the development server with `pnpm dev` for local development or `pnpm build && pnpm start` for production deployment.

### Chrome Extension Setup

Navigate to the `chrome_extension` directory in the project root. The extension requires no build step as it uses vanilla JavaScript. Open Chrome and navigate to `chrome://extensions/`. Enable Developer Mode using the toggle in the top right corner.

Click "Load unpacked" and select the `chrome_extension` directory. The extension icon should appear in your browser toolbar. Click the extension icon to open the popup interface and begin tracking developers.

Note that the extension requires icon files in the `assets` directory. Generate or provide PNG icons at 16x16, 48x48, and 128x128 pixel dimensions following the design guidelines in the assets README.

### Web Dashboard Access

The web dashboard deploys automatically when the backend service starts. Access the dashboard at the URL provided by your hosting platform. For local development, the dashboard runs at `http://localhost:3000` by default.

The dashboard requires no additional configuration beyond the backend setup. All API endpoints are automatically configured through the tRPC client. Users can browse developers, view profiles, and subscribe to notifications without authentication for public features.

## API Documentation

### Developer Endpoints

The `developers.list` query returns a paginated list of all tracked developers sorted by reputation score. Parameters include `limit` for the number of results (default 100) and `offset` for pagination. The response includes basic developer information and calculated scores.

The `developers.getByWallet` query accepts a `walletAddress` parameter and returns the developer profile associated with that wallet. This endpoint checks both primary wallets and associated wallet addresses. Returns null if no developer is found for the given address.

The `developers.getProfile` query requires a `developerId` parameter and returns comprehensive profile data including wallet associations, token launch history, Twitter linkages, and calculated reputation metrics. This endpoint provides all information needed to render a complete developer profile page.

The `developers.search` query accepts a `query` string parameter and searches developer names and wallet addresses. The optional `limit` parameter controls result count (default 20). This endpoint supports partial matching for user-friendly search functionality.

### Token Endpoints

The `tokens.getByDeveloper` query accepts a `developerId` parameter and returns all tokens launched by that developer. Results include token metadata, current status, launch dates, and migration information. Tokens are sorted by launch date in descending order.

The `tokens.getByAddress` query accepts a `tokenAddress` parameter and returns detailed information about a specific token. This includes the associated developer, current status, market cap data, and migration history. Returns null if the token is not found in the database.

### Notification Endpoints

The `notifications.list` query requires authentication and returns notifications for the current user. The optional `limit` parameter controls how many notifications to return (default 50). Notifications include launch alerts, migration successes, and suspicious pattern warnings.

The `notifications.markAsRead` mutation accepts a `notificationId` parameter and marks the specified notification as read. This endpoint requires authentication to ensure users can only modify their own notifications.

The `notifications.subscribe` mutation creates a notification subscription for a specific developer. Parameters include `developerId` and boolean flags for `notifyOnLaunch`, `notifyOnMigration`, and `notifyOnSuspicious`. Users receive real-time alerts when subscribed developers trigger these events.

The `notifications.getSubscriptions` query returns all active notification subscriptions for the authenticated user. This allows the frontend to display which developers the user is currently tracking.

## Database Schema

### Core Tables

The `developers` table stores aggregated developer information including the primary wallet address, display name, and calculated metrics. Columns track total tokens launched, migrated tokens, bonded tokens, and failed tokens. The migration success rate and overall reputation score are stored as integers from 0 to 100.

The `walletAssociations` table links multiple wallet addresses to a single developer profile. Each association includes a confidence score indicating the likelihood that the wallet belongs to the developer. The association method field records how the connection was identified (transaction patterns, Twitter links, or manual verification).

The `tokens` table contains metadata for all tracked tokens including the token address, name, symbol, and current status. Status values include active, migrated, bonded, failed, rugged, and abandoned. Launch and migration dates enable timeline analysis. Market cap fields store string values to handle large numbers.

The `migrationEvents` table records individual migration transactions with source and destination platforms. The transaction signature provides blockchain verification. Success flags indicate whether migrations completed successfully. This table enables detailed migration history analysis.

The `twitterLinkages` table associates Twitter accounts and communities with developers. Fields include Twitter username, user ID, community ID, and community name. The linkage type distinguishes between personal accounts and community administrations. Verification status adds credibility signals.

The `notificationSubscriptions` table tracks user preferences for developer notifications. Boolean flags control which event types trigger notifications. This enables granular notification control without overwhelming users with alerts.

The `notifications` table stores the notification history with message content, timestamps, and read status. The notification type field enables filtering and categorization. References to developers and tokens provide context for each notification.

## Development Guide

### Project Structure

The server code resides in the `server` directory with core functionality in subdirectories. The `_core` directory contains framework-level code including authentication, tRPC setup, and environment configuration. Feature-specific code lives in dedicated service files like `solanaService.ts` and `twitterService.ts`.

Database operations centralize in `db.ts` and `developerDb.ts` to maintain separation between data access and business logic. The `routers.ts` file defines all tRPC procedures and serves as the API contract. Background jobs and monitoring logic reside in `notificationService.ts` and `scoringService.ts`.

The client code organizes into `pages`, `components`, and `lib` directories following React conventions. Pages represent route-level components while shared UI elements live in the components directory. The `lib/trpc.ts` file configures the tRPC client for type-safe API calls.

### Adding New Features

To add a new developer metric, first extend the database schema in `drizzle/schema.ts` with the required columns. Run `pnpm db:push` to apply migrations. Add calculation logic in `scoringService.ts` within the appropriate scoring function.

Update the `updateDeveloperScores` function to include the new metric in score calculations. Modify the `getDeveloperProfile` query in `developerDb.ts` to include the new data. Finally, update frontend components to display the new metric in developer profiles.

For new data sources beyond Solana and Twitter, create a dedicated service file following the pattern of `solanaService.ts`. Implement data collection functions with error handling and rate limiting. Add database tables and queries to store the collected data. Create tRPC procedures to expose the data through the API.

### Testing Guidelines

Write unit tests for all scoring algorithms and data processing functions. Test files should colocate with the code they test using the `.test.ts` extension. Use Vitest's `describe` and `it` functions to organize test cases logically.

Mock external API calls to ensure tests run reliably without network dependencies. The `auth.logout.test.ts` file demonstrates the pattern for testing tRPC procedures with mocked contexts. Test both success and error paths to ensure robust error handling.

Run the test suite with `pnpm test` before committing changes. Aim for high coverage on business logic while avoiding testing framework code. Integration tests should verify that different system components work together correctly.

## Deployment

### Railway Deployment

Railway provides a straightforward deployment platform for the backend service. Connect your GitHub repository to Railway and configure the project settings. Set environment variables through the Railway dashboard including database credentials and API keys.

Railway automatically detects the Node.js project and configures build commands. The platform handles SSL certificates and provides a public URL for API access. Database backups and monitoring are available through the Railway dashboard.

### Alternative Hosting

The backend service runs on any Node.js hosting platform including Heroku, DigitalOcean App Platform, or AWS Elastic Beanstalk. Ensure the platform supports long-running processes for background monitoring jobs. Configure environment variables according to platform-specific methods.

For containerized deployments, create a Dockerfile that installs dependencies, builds the application, and starts the server. Use Docker Compose to orchestrate the application and database containers. Kubernetes deployments require additional configuration for service discovery and load balancing.

### Chrome Extension Distribution

Publish the extension to the Chrome Web Store through the Chrome Developer Dashboard. Create a developer account and pay the one-time registration fee. Prepare promotional images and screenshots following Chrome Web Store guidelines.

Package the extension directory as a ZIP file excluding development files and documentation. Upload the package through the developer dashboard and complete the store listing with descriptions, categories, and privacy policy information. Submit for review and wait for approval before the extension becomes publicly available.

## Contributing

Contributions are welcome from developers interested in improving Solana ecosystem transparency. Before submitting pull requests, review the existing codebase to understand the architecture and coding patterns. Ensure all tests pass and add new tests for added functionality.

Follow the TypeScript and React best practices established in the codebase. Use meaningful variable names and add comments for complex logic. Format code with Prettier before committing to maintain consistency.

Open issues for bugs, feature requests, or questions about the project. Provide detailed reproduction steps for bugs and clear use cases for feature requests. Engage constructively in discussions and respect the maintainers' decisions on project direction.

## License

This project is released under the MIT License, allowing free use, modification, and distribution. The license text is available in the LICENSE file in the repository root. Attribution is appreciated but not required.

## Support

For questions and support, open an issue on the GitHub repository. The community and maintainers will respond to inquiries as time permits. For security vulnerabilities, please report privately through GitHub's security advisory feature.

## Acknowledgments

This project builds on the Solana blockchain infrastructure and relies on Helius for enhanced RPC access. The Twitter API enables social presence tracking. The open-source community provides the frameworks and libraries that make this project possible.

Special thanks to the Solana developer community for building transparent, accessible blockchain infrastructure. The memecoin ecosystem's rapid innovation drives the need for reputation tracking systems like this one.

---

**Built with transparency. Powered by data. Driven by community.**
