ALTER TABLE `partnerships` MODIFY COLUMN `status` enum('green','engaged','yellow','gray','blue','white') NOT NULL DEFAULT 'green';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `partnershipStatus` enum('single','green','engaged','yellow','gray','blue','white') NOT NULL DEFAULT 'single';--> statement-breakpoint
ALTER TABLE `users` ADD `phoneVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `phoneVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationCode` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `smsVerificationCode` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `smsVerificationExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `singleCertificateUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `singleCertificateStatus` enum('not_uploaded','pending','approved','rejected') DEFAULT 'not_uploaded' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `singleCertificateUploadedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `singleCertificateReviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `prefecture` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `showPrefectureOnCert` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `showNameOnCert` boolean DEFAULT true NOT NULL;