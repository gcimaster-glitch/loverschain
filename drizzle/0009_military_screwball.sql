ALTER TABLE `users` ADD `pendingPlanType` enum('lover','engagement','student');--> statement-breakpoint
ALTER TABLE `users` ADD `pendingPlanPaidAt` timestamp;