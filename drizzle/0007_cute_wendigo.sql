ALTER TABLE `partnerships` ADD `jAgreementRecordId` varchar(64);--> statement-breakpoint
ALTER TABLE `partnerships` ADD `blockchainBlockNumber` int;--> statement-breakpoint
ALTER TABLE `partnerships` ADD `blockchainConfirmedAt` timestamp;