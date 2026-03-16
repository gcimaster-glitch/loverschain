CREATE TABLE `notification_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnershipId` int NOT NULL,
	`userId` int NOT NULL,
	`milestoneLabel` varchar(100) NOT NULL,
	`milestoneDays` int NOT NULL,
	`status` enum('sent','failed') NOT NULL DEFAULT 'sent',
	`errorMessage` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_logs_id` PRIMARY KEY(`id`)
);
