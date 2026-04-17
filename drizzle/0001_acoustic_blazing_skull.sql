CREATE TABLE `charities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` longtext,
	`logoUrl` text,
	`bannerUrl` text,
	`website` varchar(255),
	`featured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `charities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `charityEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`charityId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` longtext,
	`eventDate` date NOT NULL,
	`location` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `charityEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drawResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drawId` int NOT NULL,
	`matchType` enum('5-number','4-number','3-number') NOT NULL,
	`drawnNumbers` varchar(255) NOT NULL,
	`prizeAmount` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `drawResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `draws` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drawMonth` date NOT NULL,
	`drawLogic` enum('random','algorithmic') NOT NULL DEFAULT 'random',
	`status` enum('pending','simulated','published','completed') NOT NULL DEFAULT 'pending',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `draws_id` PRIMARY KEY(`id`),
	CONSTRAINT `draws_drawMonth_unique` UNIQUE(`drawMonth`)
);
--> statement-breakpoint
CREATE TABLE `emailLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailType` enum('draw_result','winner_alert','subscription_renewal','system_update') NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`status` enum('sent','failed','bounced') NOT NULL DEFAULT 'sent',
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `golfScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`score` mediumint NOT NULL,
	`scoreDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `golfScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prizePools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drawId` int NOT NULL,
	`totalSubscribers` int NOT NULL,
	`totalPoolAmount` decimal(12,2) NOT NULL,
	`fiveMatchPool` decimal(12,2) NOT NULL,
	`fourMatchPool` decimal(12,2) NOT NULL,
	`threeMatchPool` decimal(12,2) NOT NULL,
	`rolloverAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prizePools_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeCustomerId` varchar(255) NOT NULL,
	`stripeSubscriptionId` varchar(255),
	`planType` enum('monthly','yearly') NOT NULL,
	`status` enum('active','lapsed','cancelled','pending') NOT NULL DEFAULT 'pending',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `subscriptions_stripeSubscriptionId_unique` UNIQUE(`stripeSubscriptionId`)
);
--> statement-breakpoint
CREATE TABLE `userCharities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`charityId` int NOT NULL,
	`contributionPercentage` decimal(5,2) NOT NULL DEFAULT '10',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userCharities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `winnerProofs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`winnerId` int NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `winnerProofs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `winners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drawId` int NOT NULL,
	`userId` int NOT NULL,
	`matchType` enum('5-number','4-number','3-number') NOT NULL,
	`prizeAmount` decimal(12,2) NOT NULL,
	`verificationStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('pending','paid') NOT NULL DEFAULT 'pending',
	`verifiedAt` timestamp,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `winners_id` PRIMARY KEY(`id`)
);
