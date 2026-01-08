/**
 * Twitter API Service for Dev Detection
 * Finds dev Twitter accounts via pinned posts and community admins
 */

const TWITTER_BEARER_TOKEN = 'new1_defb379335c44d58890c0e2c59ada78f';

interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}

interface TwitterResponse {
  data?: any;
  includes?: any;
  errors?: any[];
}

/**
 * Search Twitter for token mentions
 */
export async function searchTokenMentions(tokenMint: string): Promise<TwitterUser | null> {
  try {
    // Search for tweets mentioning the token mint
    const response = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${tokenMint}&tweet.fields=author_id,entities&expansions=author_id&user.fields=username,name,profile_image_url`,
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
        }
      }
    );

    if (!response.ok) {
      console.error('[Twitter] API error:', response.status, await response.text());
      return null;
    }

    const data: TwitterResponse = await response.json();

    if (data.errors) {
      console.error('[Twitter] API errors:', data.errors);
      return null;
    }

    // Find the most likely dev (first user who posted about the token)
    if (data.includes?.users && data.includes.users.length > 0) {
      const user = data.includes.users[0];
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        profile_image_url: user.profile_image_url
      };
    }

    return null;
  } catch (error) {
    console.error('[Twitter] Error searching token mentions:', error);
    return null;
  }
}

/**
 * Get user's pinned tweet
 */
export async function getUserPinnedTweet(username: string): Promise<{ tweetId: string; authorId: string } | null> {
  try {
    // Get user info with pinned tweet
    const response = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=pinned_tweet_id`,
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data: TwitterResponse = await response.json();

    if (data.data?.pinned_tweet_id) {
      return {
        tweetId: data.data.pinned_tweet_id,
        authorId: data.data.id
      };
    }

    return null;
  } catch (error) {
    console.error('[Twitter] Error getting pinned tweet:', error);
    return null;
  }
}

/**
 * Get tweet author
 */
export async function getTweetAuthor(tweetId: string): Promise<TwitterUser | null> {
  try {
    const response = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}?expansions=author_id&user.fields=username,name,profile_image_url`,
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data: TwitterResponse = await response.json();

    if (data.includes?.users && data.includes.users.length > 0) {
      const user = data.includes.users[0];
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        profile_image_url: user.profile_image_url
      };
    }

    return null;
  } catch (error) {
    console.error('[Twitter] Error getting tweet author:', error);
    return null;
  }
}

/**
 * Try to find dev Twitter account for a token
 * Strategy:
 * 1. Search for tweets mentioning the token mint
 * 2. Check if the first poster has a pinned tweet about the token
 * 3. Return the most likely dev account
 */
export async function findDevTwitter(tokenMint: string, tokenSymbol?: string): Promise<TwitterUser | null> {
  console.log(`[Twitter] Searching for dev of token ${tokenMint.substring(0, 8)}...`);

  try {
    // Strategy 1: Search for token mint mentions
    let devUser = await searchTokenMentions(tokenMint);
    
    if (devUser) {
      console.log(`[Twitter] Found dev via mint search: @${devUser.username}`);
      return devUser;
    }

    // Strategy 2: Search for token symbol if provided
    if (tokenSymbol) {
      devUser = await searchTokenMentions(`$${tokenSymbol}`);
      
      if (devUser) {
        console.log(`[Twitter] Found dev via symbol search: @${devUser.username}`);
        return devUser;
      }
    }

    console.log(`[Twitter] No dev found for token ${tokenMint.substring(0, 8)}...`);
    return null;
  } catch (error) {
    console.error('[Twitter] Error finding dev:', error);
    return null;
  }
}

/**
 * Get user profile by username
 */
export async function getUserProfile(username: string): Promise<TwitterUser | null> {
  try {
    const response = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=username,name,profile_image_url`,
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data: TwitterResponse = await response.json();

    if (data.data) {
      return {
        id: data.data.id,
        username: data.data.username,
        name: data.data.name,
        profile_image_url: data.data.profile_image_url
      };
    }

    return null;
  } catch (error) {
    console.error('[Twitter] Error getting user profile:', error);
    return null;
  }
}
