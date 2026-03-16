ALTER TABLE `payment_orders` MODIFY COLUMN `orderType` enum('partnership_lover','partnership_engagement','partnership_student','split_inviter','split_accepter','coin_purchase','renewal','physical_certificate','bank_transfer') NOT NULL;--> statement-breakpoint
ALTER TABLE `invitations` ADD `isSplitPayment` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `invitations` ADD `inviterPaidAt` timestamp;--> statement-breakpoint
ALTER TABLE `invitations` ADD `accepterPaidAt` timestamp;