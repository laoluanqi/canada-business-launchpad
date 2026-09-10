CREATE TABLE `launch_journeys` (
	`owner_hash` text PRIMARY KEY NOT NULL,
	`id` text NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `launch_journeys_id_unique` ON `launch_journeys` (`id`);