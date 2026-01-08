# API Documentation

## Base URL

```
https://your-deployment-url.com/api/trpc
```

## Authentication

Most endpoints are public and do not require authentication. Notification-related endpoints require authentication via Manus OAuth session cookies.

## tRPC Query Format

All queries use the tRPC protocol with the following URL structure:

```
GET /api/trpc/[procedure]?input=[URLEncoded JSON]
```

## Developer Endpoints

### List Developers

**Procedure:** `developers.list`

**Parameters:**
- `limit` (number, optional): Number of results to return (default: 100)
- `offset` (number, optional): Pagination offset (default: 0)

**Example Request:**
```
GET /api/trpc/developers.list?input={"limit":50,"offset":0}
```

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "primaryWallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        "displayName": "Example Developer",
        "totalTokensLaunched": 15,
        "migratedTokens": 10,
        "bondedTokens": 8,
        "failedTokens": 2,
        "migrationSuccessRate": 67,
        "reputationScore": 75,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-08T00:00:00.000Z"
      }
    ]
  }
}
```

### Get Developer by Wallet

**Procedure:** `developers.getByWallet`

**Parameters:**
- `walletAddress` (string, required): Solana wallet address

**Example Request:**
```
GET /api/trpc/developers.getByWallet?input={"walletAddress":"7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"}
```

**Response:**
```json
{
  "result": {
    "data": {
      "id": 1,
      "primaryWallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "displayName": "Example Developer",
      "totalTokensLaunched": 15,
      "migratedTokens": 10,
      "bondedTokens": 8,
      "failedTokens": 2,
      "migrationSuccessRate": 67,
      "reputationScore": 75
    }
  }
}
```

### Get Developer Profile

**Procedure:** `developers.getProfile`

**Parameters:**
- `developerId` (number, required): Developer ID

**Example Request:**
```
GET /api/trpc/developers.getProfile?input={"developerId":1}
```

**Response:**
```json
{
  "result": {
    "data": {
      "id": 1,
      "primaryWallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "displayName": "Example Developer",
      "totalTokensLaunched": 15,
      "migratedTokens": 10,
      "bondedTokens": 8,
      "failedTokens": 2,
      "migrationSuccessRate": 67,
      "reputationScore": 75,
      "wallets": [
        {
          "id": 1,
          "developerId": 1,
          "walletAddress": "8yKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsV",
          "confidenceScore": 85,
          "associationMethod": "transaction_pattern"
        }
      ],
      "tokens": [
        {
          "id": 1,
          "developerId": 1,
          "tokenAddress": "9zKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsW",
          "name": "Example Token",
          "symbol": "EXT",
          "status": "migrated",
          "launchDate": "2024-01-01T00:00:00.000Z",
          "migrationDate": "2024-01-05T00:00:00.000Z"
        }
      ],
      "twitterAccounts": [
        {
          "id": 1,
          "developerId": 1,
          "twitterUsername": "exampledev",
          "twitterUserId": "123456789",
          "linkageType": "account",
          "verified": 1
        }
      ]
    }
  }
}
```

### Search Developers

**Procedure:** `developers.search`

**Parameters:**
- `query` (string, required): Search query
- `limit` (number, optional): Number of results (default: 20)

**Example Request:**
```
GET /api/trpc/developers.search?input={"query":"example","limit":10}
```

## Token Endpoints

### Get Tokens by Developer

**Procedure:** `tokens.getByDeveloper`

**Parameters:**
- `developerId` (number, required): Developer ID

**Example Request:**
```
GET /api/trpc/tokens.getByDeveloper?input={"developerId":1}
```

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "developerId": 1,
        "tokenAddress": "9zKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsW",
        "name": "Example Token",
        "symbol": "EXT",
        "status": "migrated",
        "launchDate": "2024-01-01T00:00:00.000Z",
        "migrationDate": "2024-01-05T00:00:00.000Z",
        "launchMarketCap": "100000",
        "currentMarketCap": "500000"
      }
    ]
  }
}
```

### Get Token by Address

**Procedure:** `tokens.getByAddress`

**Parameters:**
- `tokenAddress` (string, required): Token mint address

**Example Request:**
```
GET /api/trpc/tokens.getByAddress?input={"tokenAddress":"9zKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsW"}
```

## Notification Endpoints

### List Notifications

**Procedure:** `notifications.list`

**Authentication:** Required

**Parameters:**
- `limit` (number, optional): Number of results (default: 50)

**Example Request:**
```
GET /api/trpc/notifications.list?input={"limit":20}
```

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "userId": 1,
        "developerId": 1,
        "tokenId": 1,
        "notificationType": "launch",
        "title": "New Token Launch",
        "message": "A developer you're tracking launched a new token: Example Token (EXT)",
        "isRead": 0,
        "createdAt": "2024-01-08T00:00:00.000Z"
      }
    ]
  }
}
```

### Mark Notification as Read

**Procedure:** `notifications.markAsRead`

**Authentication:** Required

**Method:** Mutation

**Parameters:**
- `notificationId` (number, required): Notification ID

**Example Request:**
```
POST /api/trpc/notifications.markAsRead
Content-Type: application/json

{"notificationId": 1}
```

**Response:**
```json
{
  "result": {
    "data": {
      "success": true
    }
  }
}
```

### Subscribe to Developer

**Procedure:** `notifications.subscribe`

**Authentication:** Required

**Method:** Mutation

**Parameters:**
- `developerId` (number, required): Developer ID to subscribe to
- `notifyOnLaunch` (boolean, optional): Notify on new token launches (default: true)
- `notifyOnMigration` (boolean, optional): Notify on successful migrations (default: true)
- `notifyOnSuspicious` (boolean, optional): Notify on suspicious patterns (default: true)

**Example Request:**
```
POST /api/trpc/notifications.subscribe
Content-Type: application/json

{
  "developerId": 1,
  "notifyOnLaunch": true,
  "notifyOnMigration": true,
  "notifyOnSuspicious": true
}
```

**Response:**
```json
{
  "result": {
    "data": {
      "success": true
    }
  }
}
```

### Get Subscriptions

**Procedure:** `notifications.getSubscriptions`

**Authentication:** Required

**Example Request:**
```
GET /api/trpc/notifications.getSubscriptions
```

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "userId": 1,
        "developerId": 1,
        "notifyOnLaunch": 1,
        "notifyOnMigration": 1,
        "notifyOnSuspicious": 1
      }
    ]
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "data": {
      "code": "INTERNAL_SERVER_ERROR",
      "httpStatus": 500
    }
  }
}
```

Common error codes:
- `BAD_REQUEST`: Invalid input parameters
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `INTERNAL_SERVER_ERROR`: Server error

## Rate Limiting

The API does not currently implement rate limiting, but this may be added in future versions. Please be respectful of server resources and implement client-side throttling for bulk requests.

## Webhooks

Webhook support is planned for future releases to enable real-time notifications without polling.
