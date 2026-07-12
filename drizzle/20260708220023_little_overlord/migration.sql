CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`shareId` text NOT NULL,
	`data` text NOT NULL,
	`createdAt` integer NOT NULL,
	CONSTRAINT `fk_submissions_shareId_shares_id_fk` FOREIGN KEY (`shareId`) REFERENCES `shares`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `submissions_share_id_idx` ON `submissions` (`shareId`);