CREATE TABLE `todos` (
	`id` integer PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`done` integer DEFAULT false NOT NULL
);
