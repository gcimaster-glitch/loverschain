CREATE TABLE `dissolution_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnershipId` int NOT NULL,
	`requestedBy` int NOT NULL,
	`type` enum('mutual','unilateral') NOT NULL,
	`reason` text,
	`status` enum('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
	`confirmedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dissolution_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inviterId` int NOT NULL,
	`inviteeEmail` varchar(320),
	`invitationKey` varchar(64) NOT NULL,
	`status` enum('pending','accepted','expired','cancelled') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_invitationKey_unique` UNIQUE(`invitationKey`)
);
--> statement-breakpoint
CREATE TABLE `partnership_status_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnershipId` int NOT NULL,
	`fromStatus` varchar(20),
	`toStatus` varchar(20) NOT NULL,
	`changedBy` int,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partnership_status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partnerships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user1Id` int NOT NULL,
	`user2Id` int NOT NULL,
	`status` enum('green','yellow','gray','blue','white') NOT NULL DEFAULT 'green',
	`blockchainTxHash` varchar(255),
	`certificateUrl` text,
	`blockchainRegisteredAt` timestamp,
	`dissolutionType` enum('mutual','unilateral'),
	`dissolutionRequestedBy` int,
	`dissolutionConfirmedAt` timestamp,
	`coolingOffEndsAt` timestamp,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partnerships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `displayName` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `gender` enum('male','female','other','prefer_not_to_say');--> statement-breakpoint
ALTER TABLE `users` ADD `birthDate` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `kycStatus` enum('not_started','pending','verified','failed') DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `kycVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeVerificationSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `partnershipStatus` enum('single','green','yellow','gray','blue','white') DEFAULT 'single' NOT NULL;