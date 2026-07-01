CREATE TABLE `shares` (
	`id` text PRIMARY KEY,
	`content` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL
);
