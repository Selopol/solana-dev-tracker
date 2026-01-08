CREATE TABLE `developers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`primaryWallet` varchar(44) NOT NULL,
	`displayName` text,
	`totalTokensLaunched` int NOT NULL DEFAULT 0,
	`migratedTokens` int NOT NULL DEFAULT 0,
	`bondedTokens` int NOT NULL DEFAULT 0,
	`failedTokens` int NOT NULL DEFAULT 0,
	`migrationSuccessRate` int NOT NULL DEFAULT 0,
	`reputationScore` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `developers_id` PRIMARY KEY(`id`),
	CONSTRAINT `developers_primaryWallet_unique` UNIQUE(`primaryWallet`)
);
--> statement-breakpoint
CREATE TABLE `migrationEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tokenId` int NOT NULL,
	`fromPlatform` varchar(64),
	`toPlatform` varchar(64),
	`txSignature` varchar(88),
	`migrationDate` timestamp NOT NULL,
	`success` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `migrationEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`developerId` int NOT NULL,
	`notifyOnLaunch` int NOT NULL DEFAULT 1,
	`notifyOnMigration` int NOT NULL DEFAULT 1,
	`notifyOnSuspicious` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationSubscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`developerId` int NOT NULL,
	`tokenId` int,
	`notificationType` enum('launch','migration','suspicious','rug_pull') NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`developerId` int NOT NULL,
	`tokenAddress` varchar(44) NOT NULL,
	`name` text,
	`symbol` varchar(32),
	`status` enum('active','migrated','bonded','failed','rugged','abandoned') NOT NULL DEFAULT 'active',
	`launchDate` timestamp,
	`migrationDate` timestamp,
	`launchMarketCap` varchar(32),
	`currentMarketCap` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `tokens_tokenAddress_unique` UNIQUE(`tokenAddress`)
);
--> statement-breakpoint
CREATE TABLE `twitterLinkages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`developerId` int NOT NULL,
	`twitterUsername` varchar(64),
	`twitterUserId` varchar(64),
	`twitterCommunityId` varchar(64),
	`twitterCommunityName` text,
	`linkageType` enum('account','community') NOT NULL,
	`verified` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `twitterLinkages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `walletAssociations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`developerId` int NOT NULL,
	`walletAddress` varchar(44) NOT NULL,
	`confidenceScore` int NOT NULL DEFAULT 100,
	`associationMethod` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `walletAssociations_id` PRIMARY KEY(`id`),
	CONSTRAINT `walletAssociations_walletAddress_unique` UNIQUE(`walletAddress`)
);
