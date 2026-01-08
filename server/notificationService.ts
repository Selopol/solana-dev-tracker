import { createNotification, getNotificationSubscriptions } from "./developerDb";
import { notifyOwner } from "./_core/notification";

/**
 * Notification Service for Developer Activity Alerts
 * Sends notifications when tracked developers launch tokens, migrate, or show suspicious patterns
 */

interface NotificationData {
  userId: number;
  developerId: number;
  tokenId?: number;
  type: "launch" | "migration" | "suspicious" | "rug_pull";
  title: string;
  message: string;
}

/**
 * Send notification to a user
 */
export async function sendUserNotification(data: NotificationData): Promise<void> {
  try {
    await createNotification({
      userId: data.userId,
      developerId: data.developerId,
      tokenId: data.tokenId || null,
      notificationType: data.type,
      title: data.title,
      message: data.message,
      isRead: 0,
    });

    console.log(`Notification sent to user ${data.userId}: ${data.title}`);
  } catch (error) {
    console.error("Failed to send user notification:", error);
  }
}

/**
 * Notify all subscribers of a developer about a new token launch
 */
export async function notifyTokenLaunch(
  developerId: number,
  tokenId: number,
  tokenName: string,
  tokenSymbol: string
): Promise<void> {
  try {
    const subscriptions = await getNotificationSubscriptions(0); // Get all subscriptions
    const relevantSubs = subscriptions.filter(
      (sub) => sub.developerId === developerId && sub.notifyOnLaunch === 1
    );

    for (const sub of relevantSubs) {
      await sendUserNotification({
        userId: sub.userId,
        developerId,
        tokenId,
        type: "launch",
        title: "New Token Launch",
        message: `A developer you're tracking launched a new token: ${tokenName} (${tokenSymbol})`,
      });
    }

    // Also notify owner
    await notifyOwner({
      title: "New Token Launch Detected",
      content: `Developer ${developerId} launched ${tokenName} (${tokenSymbol})`,
    });
  } catch (error) {
    console.error("Failed to notify token launch:", error);
  }
}

/**
 * Notify all subscribers about a successful migration
 */
export async function notifyMigrationSuccess(
  developerId: number,
  tokenId: number,
  tokenName: string,
  fromPlatform: string,
  toPlatform: string
): Promise<void> {
  try {
    const subscriptions = await getNotificationSubscriptions(0);
    const relevantSubs = subscriptions.filter(
      (sub) => sub.developerId === developerId && sub.notifyOnMigration === 1
    );

    for (const sub of relevantSubs) {
      await sendUserNotification({
        userId: sub.userId,
        developerId,
        tokenId,
        type: "migration",
        title: "Successful Migration",
        message: `${tokenName} successfully migrated from ${fromPlatform} to ${toPlatform}`,
      });
    }

    // Also notify owner
    await notifyOwner({
      title: "Token Migration Detected",
      content: `${tokenName} migrated from ${fromPlatform} to ${toPlatform}`,
    });
  } catch (error) {
    console.error("Failed to notify migration success:", error);
  }
}

/**
 * Notify about suspicious developer patterns
 */
export async function notifySuspiciousPattern(
  developerId: number,
  patterns: string[],
  riskScore: number
): Promise<void> {
  try {
    const subscriptions = await getNotificationSubscriptions(0);
    const relevantSubs = subscriptions.filter(
      (sub) => sub.developerId === developerId && sub.notifyOnSuspicious === 1
    );

    const patternList = patterns.join(", ");

    for (const sub of relevantSubs) {
      await sendUserNotification({
        userId: sub.userId,
        developerId,
        type: "suspicious",
        title: "⚠️ Suspicious Activity Detected",
        message: `A developer you're tracking shows suspicious patterns: ${patternList}. Risk score: ${riskScore}/100`,
      });
    }

    // Always notify owner about suspicious patterns
    await notifyOwner({
      title: "⚠️ Suspicious Developer Pattern Detected",
      content: `Developer ${developerId} shows suspicious patterns: ${patternList}. Risk score: ${riskScore}/100`,
    });
  } catch (error) {
    console.error("Failed to notify suspicious pattern:", error);
  }
}

/**
 * Notify about a detected rug pull
 */
export async function notifyRugPull(
  developerId: number,
  tokenId: number,
  tokenName: string,
  reason: string
): Promise<void> {
  try {
    const subscriptions = await getNotificationSubscriptions(0);
    const relevantSubs = subscriptions.filter(
      (sub) => sub.developerId === developerId && sub.notifyOnSuspicious === 1
    );

    for (const sub of relevantSubs) {
      await sendUserNotification({
        userId: sub.userId,
        developerId,
        tokenId,
        type: "rug_pull",
        title: "🚨 Rug Pull Detected",
        message: `${tokenName} appears to be a rug pull. Reason: ${reason}`,
      });
    }

    // Critical alert to owner
    await notifyOwner({
      title: "🚨 Rug Pull Detected",
      content: `Token ${tokenName} (ID: ${tokenId}) from developer ${developerId} appears to be a rug pull. Reason: ${reason}`,
    });
  } catch (error) {
    console.error("Failed to notify rug pull:", error);
  }
}

/**
 * Send daily digest of tracked developers' activities
 */
export async function sendDailyDigest(userId: number): Promise<void> {
  try {
    const subscriptions = await getNotificationSubscriptions(userId);

    if (subscriptions.length === 0) {
      return;
    }

    // Gather activity data for all subscribed developers
    const activities: string[] = [];

    for (const sub of subscriptions) {
      // In a real implementation, you would fetch recent activity for each developer
      // For now, this is a placeholder
      activities.push(`Developer ${sub.developerId}: No recent activity`);
    }

    if (activities.length > 0) {
      await sendUserNotification({
        userId,
        developerId: subscriptions[0].developerId, // Use first developer as reference
        type: "launch",
        title: "Daily Developer Activity Digest",
        message: `Here's what happened with your tracked developers today:\n${activities.join("\n")}`,
      });
    }
  } catch (error) {
    console.error("Failed to send daily digest:", error);
  }
}

/**
 * Background job to monitor developer activities
 * Should be run periodically (e.g., every 5 minutes)
 */
export async function monitorDeveloperActivities(): Promise<void> {
  console.log("Starting developer activity monitoring...");

  try {
    const { getAllDevelopers } = await import("./developerDb");
    const { detectSuspiciousPatterns } = await import("./scoringService");

    const developers = await getAllDevelopers(100);

    for (const developer of developers) {
      try {
        // Check for suspicious patterns
        const suspicious = await detectSuspiciousPatterns(developer.id);

        if (suspicious.isSuspicious) {
          await notifySuspiciousPattern(
            developer.id,
            suspicious.patterns,
            suspicious.riskScore
          );
        }

        // In a real implementation, you would also:
        // - Check for new token launches
        // - Check for new migrations
        // - Check for rug pulls
        // - Update developer scores
      } catch (error) {
        console.error(`Failed to monitor developer ${developer.id}:`, error);
      }
    }

    console.log("Developer activity monitoring completed");
  } catch (error) {
    console.error("Developer activity monitoring failed:", error);
  }
}

/**
 * Schedule periodic monitoring
 * This should be called when the server starts
 */
export function startMonitoringSchedule(): void {
  // Run monitoring every 5 minutes
  const MONITORING_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

  setInterval(() => {
    monitorDeveloperActivities().catch((error) => {
      console.error("Scheduled monitoring failed:", error);
    });
  }, MONITORING_INTERVAL);

  console.log("Developer monitoring schedule started (every 5 minutes)");

  // Run initial monitoring after 1 minute
  setTimeout(() => {
    monitorDeveloperActivities().catch((error) => {
      console.error("Initial monitoring failed:", error);
    });
  }, 60000);
}
