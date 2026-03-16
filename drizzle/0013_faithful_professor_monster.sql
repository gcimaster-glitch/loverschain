CREATE TABLE `partner_status_inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requesterId` int NOT NULL,
	`targetEmail` varchar(320) NOT NULL,
	`targetUserId` int,
	`token` varchar(64) NOT NULL,
	`status` enum('pending','consented','declined','expired') NOT NULL DEFAULT 'pending',
	`result` enum('single','yellow','red','not_registered'),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partner_status_inquiries_id` PRIMARY KEY(`id`),
	CONSTRAINT `partner_status_inquiries_token_unique` UNIQUE(`token`)
);
