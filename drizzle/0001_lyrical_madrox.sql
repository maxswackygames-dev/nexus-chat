CREATE TABLE `channel_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','manager','member') NOT NULL DEFAULT 'member',
	`isMuted` boolean NOT NULL DEFAULT false,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `channel_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isPrivate` boolean NOT NULL DEFAULT false,
	`isArchived` boolean NOT NULL DEFAULT false,
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `direct_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user1Id` int NOT NULL,
	`user2Id` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `direct_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `file_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`fileSize` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `file_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`emoji` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `message_reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`reportedBy` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`action` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `message_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content` longtext NOT NULL,
	`authorId` int NOT NULL,
	`channelId` int,
	`directMessageId` int,
	`isEdited` boolean NOT NULL DEFAULT false,
	`editedAt` timestamp,
	`isDeleted` boolean NOT NULL DEFAULT false,
	`deletedAt` timestamp,
	`deletedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moderation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` varchar(50) NOT NULL,
	`targetUserId` int,
	`targetMessageId` int,
	`targetChannelId` int,
	`performedBy` int NOT NULL,
	`reason` text,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moderation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('mention','direct_message','channel_invite','moderation_action','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`relatedMessageId` int,
	`relatedUserId` int,
	`relatedChannelId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `read_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `read_receipts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`permission` varchar(100) NOT NULL,
	`grantedBy` int NOT NULL,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('online','offline','away') DEFAULT 'offline' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `isMuted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `isBanned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `bannedReason` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bannedAt` timestamp;--> statement-breakpoint
CREATE INDEX `channel_user_idx` ON `channel_members` (`channelId`,`userId`);--> statement-breakpoint
CREATE INDEX `channel_members_channel_idx` ON `channel_members` (`channelId`);--> statement-breakpoint
CREATE INDEX `channel_members_user_idx` ON `channel_members` (`userId`);--> statement-breakpoint
CREATE INDEX `channel_owner_idx` ON `channels` (`ownerId`);--> statement-breakpoint
CREATE INDEX `is_private_idx` ON `channels` (`isPrivate`);--> statement-breakpoint
CREATE INDEX `is_archived_idx` ON `channels` (`isArchived`);--> statement-breakpoint
CREATE INDEX `dm_user_pair_idx` ON `direct_messages` (`user1Id`,`user2Id`);--> statement-breakpoint
CREATE INDEX `dm_user1_idx` ON `direct_messages` (`user1Id`);--> statement-breakpoint
CREATE INDEX `dm_user2_idx` ON `direct_messages` (`user2Id`);--> statement-breakpoint
CREATE INDEX `attachment_message_idx` ON `file_attachments` (`messageId`);--> statement-breakpoint
CREATE INDEX `attachment_uploaded_by_idx` ON `file_attachments` (`uploadedBy`);--> statement-breakpoint
CREATE INDEX `reaction_message_user_emoji_idx` ON `message_reactions` (`messageId`,`userId`,`emoji`);--> statement-breakpoint
CREATE INDEX `reaction_message_idx` ON `message_reactions` (`messageId`);--> statement-breakpoint
CREATE INDEX `reaction_user_idx` ON `message_reactions` (`userId`);--> statement-breakpoint
CREATE INDEX `report_message_idx` ON `message_reports` (`messageId`);--> statement-breakpoint
CREATE INDEX `report_reported_by_idx` ON `message_reports` (`reportedBy`);--> statement-breakpoint
CREATE INDEX `report_status_idx` ON `message_reports` (`status`);--> statement-breakpoint
CREATE INDEX `message_author_idx` ON `messages` (`authorId`);--> statement-breakpoint
CREATE INDEX `message_channel_idx` ON `messages` (`channelId`);--> statement-breakpoint
CREATE INDEX `message_dm_idx` ON `messages` (`directMessageId`);--> statement-breakpoint
CREATE INDEX `message_created_at_idx` ON `messages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `mod_log_target_user_idx` ON `moderation_logs` (`targetUserId`);--> statement-breakpoint
CREATE INDEX `mod_log_performed_by_idx` ON `moderation_logs` (`performedBy`);--> statement-breakpoint
CREATE INDEX `mod_log_action_idx` ON `moderation_logs` (`action`);--> statement-breakpoint
CREATE INDEX `mod_log_created_at_idx` ON `moderation_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `notification_user_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notification_is_read_idx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `notification_type_idx` ON `notifications` (`type`);--> statement-breakpoint
CREATE INDEX `read_receipt_message_user_idx` ON `read_receipts` (`messageId`,`userId`);--> statement-breakpoint
CREATE INDEX `read_receipt_message_idx` ON `read_receipts` (`messageId`);--> statement-breakpoint
CREATE INDEX `read_receipt_user_idx` ON `read_receipts` (`userId`);--> statement-breakpoint
CREATE INDEX `user_permission_idx` ON `user_permissions` (`userId`,`permission`);--> statement-breakpoint
CREATE INDEX `user_permissions_user_idx` ON `user_permissions` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `users` (`status`);--> statement-breakpoint
CREATE INDEX `is_banned_idx` ON `users` (`isBanned`);