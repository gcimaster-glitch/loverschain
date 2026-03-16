CREATE TABLE `affiliate_partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('movie','restaurant','jewelry','event','hotel','travel','other') NOT NULL,
	`description` text,
	`logoUrl` text,
	`websiteUrl` text,
	`discountDescription` text NOT NULL,
	`discountCode` varchar(50),
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_partners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coin_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('purchase','use','refund','bonus','referral') NOT NULL,
	`amount` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`description` text,
	`stripePaymentIntentId` varchar(255),
	`relatedPartnershipId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coin_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `oem_agencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(20),
	`commissionRate` decimal(5,2) NOT NULL DEFAULT '50.00',
	`apiKey` varchar(64),
	`logoUrl` text,
	`primaryColor` varchar(7),
	`isActive` boolean NOT NULL DEFAULT true,
	`stripeAccountId` varchar(255),
	`totalRevenue` decimal(12,2) NOT NULL DEFAULT '0.00',
	`totalCommissionPaid` decimal(12,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `oem_agencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `oem_agencies_apiKey_unique` UNIQUE(`apiKey`)
);
--> statement-breakpoint
CREATE TABLE `payment_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orderType` enum('partnership_standard','partnership_high_school','partnership_marriage','partnership_engagement','coin_purchase','renewal','physical_certificate') NOT NULL,
	`amountJpy` int NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`stripeCheckoutSessionId` varchar(255),
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`relatedPartnershipId` int,
	`coinsGranted` int NOT NULL DEFAULT 0,
	`oemAgencyId` int,
	`commissionAmount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `physical_certificate_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnershipId` int NOT NULL,
	`orderedBy` int NOT NULL,
	`productType` enum('print_a4','frame_a4','frame_a3','digital_nft') NOT NULL,
	`status` enum('pending','paid','printing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`recipientName` varchar(100),
	`postalCode` varchar(10),
	`address` text,
	`phone` varchar(20),
	`stripePaymentIntentId` varchar(255),
	`amountJpy` int NOT NULL,
	`trackingNumber` varchar(100),
	`shippedAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `physical_certificate_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`refereeId` int NOT NULL,
	`partnershipId` int,
	`status` enum('pending','completed','rewarded') NOT NULL DEFAULT 'pending',
	`rewardCoins` int NOT NULL DEFAULT 0,
	`rewardedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sns_share_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnershipId` int NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('instagram','tiktok','facebook','twitter','line') NOT NULL,
	`shareUrl` text,
	`status` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`rewardType` enum('free_certificate','coins') NOT NULL DEFAULT 'free_certificate',
	`rewardCoins` int NOT NULL DEFAULT 0,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sns_share_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `invitations` ADD `planType` enum('standard','high_school','marriage_agency','engagement') DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `partnerships` ADD `planType` enum('standard','high_school','marriage_agency','engagement') DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `partnerships` ADD `currentRank` enum('bronze','silver_3d','silver_1m','silver_3m','silver_6m','gold_10m','gold_12m','gold_15m','platinum_20m','platinum_24m','diamond_30m','diamond_36m','legend_40m') DEFAULT 'bronze' NOT NULL;--> statement-breakpoint
ALTER TABLE `partnerships` ADD `rankUpdatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `partnerships` ADD `nextRankAt` timestamp;--> statement-breakpoint
ALTER TABLE `partnerships` ADD `renewalDueAt` timestamp;--> statement-breakpoint
ALTER TABLE `partnerships` ADD `lastRenewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `partnerships` ADD `renewalCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `partnerships` ADD `oemAgencyId` int;--> statement-breakpoint
ALTER TABLE `partnerships` ADD `referredByUserId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `coinBalance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `referralCode` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `referredBy` int;--> statement-breakpoint
ALTER TABLE `users` ADD `oemAgencyId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `isHighSchoolStudent` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `studentVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_referralCode_unique` UNIQUE(`referralCode`);