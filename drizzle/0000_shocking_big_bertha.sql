CREATE TABLE `business_workspaces` (
	`owner_hash` text PRIMARY KEY NOT NULL,
	`id` text NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `business_workspaces_id_unique` ON `business_workspaces` (`id`);