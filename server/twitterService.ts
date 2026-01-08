import axios from "axios";

/**
 * Twitter API Service for linking developer social presence
 * Uses Twitter API v2 to resolve accounts and communities
 */

const TWITTER_API_KEY = "new1_defb379335c44d58890c0e2c59ada78f";
const TWITTER_API_BASE_URL = "https://api.twitter.com/2";

interface TwitterUser {
  id: string;
  username: string;
  name: string;
  verified: boolean;
  description?: string;
  profile_image_url?: string;
}

interface TwitterCommunity {
  id: string;
  name: string;
  description?: string;
  admin_id?: string;
  member_count?: number;
}

/**
 * Make authenticated request to Twitter API
 */
async function makeTwitterRequest(endpoint: string, params?: Record<string, any>): Promise<any> {
  try {
    const response = await axios.get(`${TWITTER_API_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${TWITTER_API_KEY}`,
      },
      params,
    });

    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Twitter API error:", error.response.data);
      throw new Error(`Twitter API error: ${error.response.data.detail || error.response.statusText}`);
    }
    console.error("Twitter request failed:", error);
    throw error;
  }
}

/**
 * Get Twitter user by username
 */
export async function getTwitterUserByUsername(username: string): Promise<TwitterUser | null> {
  try {
    // Remove @ if present
    const cleanUsername = username.replace(/^@/, "");
    
    const data = await makeTwitterRequest(`/users/by/username/${cleanUsername}`, {
      "user.fields": "id,username,name,verified,description,profile_image_url",
    });

    if (!data.data) {
      return null;
    }

    return {
      id: data.data.id,
      username: data.data.username,
      name: data.data.name,
      verified: data.data.verified || false,
      description: data.data.description,
      profile_image_url: data.data.profile_image_url,
    };
  } catch (error) {
    console.error(`Failed to get Twitter user ${username}:`, error);
    return null;
  }
}

/**
 * Get Twitter user by ID
 */
export async function getTwitterUserById(userId: string): Promise<TwitterUser | null> {
  try {
    const data = await makeTwitterRequest(`/users/${userId}`, {
      "user.fields": "id,username,name,verified,description,profile_image_url",
    });

    if (!data.data) {
      return null;
    }

    return {
      id: data.data.id,
      username: data.data.username,
      name: data.data.name,
      verified: data.data.verified || false,
      description: data.data.description,
      profile_image_url: data.data.profile_image_url,
    };
  } catch (error) {
    console.error(`Failed to get Twitter user by ID ${userId}:`, error);
    return null;
  }
}

/**
 * Search for Twitter users by query
 */
export async function searchTwitterUsers(query: string, maxResults: number = 10): Promise<TwitterUser[]> {
  try {
    const data = await makeTwitterRequest("/users/search", {
      query,
      max_results: maxResults,
      "user.fields": "id,username,name,verified,description,profile_image_url",
    });

    if (!data.data) {
      return [];
    }

    return data.data.map((user: any) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      verified: user.verified || false,
      description: user.description,
      profile_image_url: user.profile_image_url,
    }));
  } catch (error) {
    console.error("Failed to search Twitter users:", error);
    return [];
  }
}

/**
 * Get tweets from a user (to analyze for token mentions)
 */
export async function getUserTweets(userId: string, maxResults: number = 100): Promise<any[]> {
  try {
    const data = await makeTwitterRequest(`/users/${userId}/tweets`, {
      max_results: maxResults,
      "tweet.fields": "created_at,text,entities,referenced_tweets",
    });

    return data.data || [];
  } catch (error) {
    console.error(`Failed to get tweets for user ${userId}:`, error);
    return [];
  }
}

/**
 * Extract Solana wallet addresses from tweet text
 */
export function extractWalletAddresses(text: string): string[] {
  // Solana wallet addresses are base58 encoded and typically 32-44 characters
  const walletRegex = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;
  const matches = text.match(walletRegex);
  
  if (!matches) return [];
  
  // Filter out common false positives
  return matches.filter(address => {
    // Basic validation: should not be all the same character
    return !(/^(.)\1+$/.test(address));
  });
}

/**
 * Extract token contract addresses from tweet text
 */
export function extractTokenAddresses(text: string): string[] {
  // Similar to wallet addresses but look for context clues
  const addresses = extractWalletAddresses(text);
  
  // Filter for addresses mentioned with token-related keywords
  const tokenKeywords = ["token", "contract", "mint", "ca:", "address:", "$"];
  const lowerText = text.toLowerCase();
  
  const hasTokenContext = tokenKeywords.some(keyword => lowerText.includes(keyword));
  
  return hasTokenContext ? addresses : [];
}

/**
 * Link Twitter account to Solana wallet by analyzing tweets
 */
export async function linkTwitterToWallet(username: string): Promise<{
  twitterUser: TwitterUser | null;
  walletAddresses: string[];
  confidence: number;
}> {
  try {
    const twitterUser = await getTwitterUserByUsername(username);
    
    if (!twitterUser) {
      return {
        twitterUser: null,
        walletAddresses: [],
        confidence: 0,
      };
    }

    // Get user's recent tweets
    const tweets = await getUserTweets(twitterUser.id, 100);
    
    // Extract wallet addresses from tweets
    const walletAddresses = new Set<string>();
    
    for (const tweet of tweets) {
      const addresses = extractWalletAddresses(tweet.text);
      addresses.forEach(addr => walletAddresses.add(addr));
    }

    // Calculate confidence based on number of mentions
    const uniqueWallets = Array.from(walletAddresses);
    const confidence = Math.min(100, uniqueWallets.length * 10);

    return {
      twitterUser,
      walletAddresses: uniqueWallets,
      confidence,
    };
  } catch (error) {
    console.error(`Failed to link Twitter account ${username}:`, error);
    return {
      twitterUser: null,
      walletAddresses: [],
      confidence: 0,
    };
  }
}

/**
 * Get Twitter community information
 * Note: Twitter Community API access is limited - this is a placeholder
 */
export async function getTwitterCommunity(communityId: string): Promise<TwitterCommunity | null> {
  try {
    // Twitter Community API requires special access
    // This is a placeholder implementation
    console.log(`Getting community ${communityId} - requires Twitter Community API access`);
    
    // In production, you would use the Community API endpoint
    // For now, return a placeholder structure
    return {
      id: communityId,
      name: "Community",
      description: "Twitter Community",
    };
  } catch (error) {
    console.error(`Failed to get Twitter community ${communityId}:`, error);
    return null;
  }
}

/**
 * Get community admins
 * Note: Requires Twitter Community API access
 */
export async function getCommunityAdmins(communityId: string): Promise<TwitterUser[]> {
  try {
    console.log(`Getting admins for community ${communityId} - requires Twitter Community API access`);
    
    // Placeholder - requires special API access
    return [];
  } catch (error) {
    console.error(`Failed to get community admins for ${communityId}:`, error);
    return [];
  }
}

/**
 * Analyze Twitter profile for developer credibility
 */
export async function analyzeTwitterCredibility(username: string): Promise<{
  score: number;
  factors: {
    verified: boolean;
    accountAge: number;
    followerCount: number;
    tweetCount: number;
    engagement: number;
  };
}> {
  try {
    const user = await getTwitterUserByUsername(username);
    
    if (!user) {
      return {
        score: 0,
        factors: {
          verified: false,
          accountAge: 0,
          followerCount: 0,
          tweetCount: 0,
          engagement: 0,
        },
      };
    }

    // Calculate credibility score based on various factors
    let score = 0;
    
    // Verified account adds credibility
    if (user.verified) {
      score += 30;
    }

    // Placeholder for other factors (would need additional API calls)
    const factors = {
      verified: user.verified,
      accountAge: 0, // Would need to calculate from created_at
      followerCount: 0, // Would need additional API call
      tweetCount: 0, // Would need additional API call
      engagement: 0, // Would need to analyze tweet metrics
    };

    return {
      score: Math.min(100, score),
      factors,
    };
  } catch (error) {
    console.error(`Failed to analyze Twitter credibility for ${username}:`, error);
    return {
      score: 0,
      factors: {
        verified: false,
        accountAge: 0,
        followerCount: 0,
        tweetCount: 0,
        engagement: 0,
      },
    };
  }
}
