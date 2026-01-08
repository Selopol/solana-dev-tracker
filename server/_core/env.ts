export const ENV = {
  appId: process.env.VITE_APP_ID ?? "solana-dev-tracker",
  cookieSecret: process.env.JWT_SECRET ?? "default-jwt-secret-change-in-production-min-32-chars",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "https://api.manus.im",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "default-owner",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "https://api.manus.im",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  heliusRpcUrl: process.env.HELIUS_RPC_URL ?? "https://mainnet.helius-rpc.com/?api-key=14649a76-7c70-443c-b6da-41cffe2543fd",
  twitterApiKey: process.env.TWITTER_API_KEY ?? "new1_defb379335c44d58890c0e2c59ada78f",
};
