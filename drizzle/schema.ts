import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  boolean,
  longtext,
  decimal,
  index,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with chat-specific fields for roles and permissions.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Chat-specific fields
  status: mysqlEnum("status", ["online", "offline", "away"]).default("offline").notNull(),
  avatar: text("avatar"), // URL to avatar image
  bio: text("bio"),
  isMuted: boolean("isMuted").default(false).notNull(),
  isBanned: boolean("isBanned").default(false).notNull(),
  bannedReason: text("bannedReason"),
  bannedAt: timestamp("bannedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  isBannedIdx: index("is_banned_idx").on(table.isBanned),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Channels table - represents chat rooms/channels
 */
export const channels = mysqlTable("channels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isPrivate: boolean("isPrivate").default(false).notNull(),
  isArchived: boolean("isArchived").default(false).notNull(),
  ownerId: int("ownerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerIdx: index("channel_owner_idx").on(table.ownerId),
  isPrivateIdx: index("is_private_idx").on(table.isPrivate),
  isArchivedIdx: index("is_archived_idx").on(table.isArchived),
}));

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = typeof channels.$inferInsert;

/**
 * Channel members table - tracks users in channels with their roles
 */
export const channelMembers = mysqlTable("channel_members", {
  id: int("id").autoincrement().primaryKey(),
  channelId: int("channelId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "manager", "member"]).default("member").notNull(),
  isMuted: boolean("isMuted").default(false).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => ({
  channelUserIdx: index("channel_user_idx").on(table.channelId, table.userId),
  channelIdx: index("channel_members_channel_idx").on(table.channelId),
  userIdx: index("channel_members_user_idx").on(table.userId),
}));

export type ChannelMember = typeof channelMembers.$inferSelect;
export type InsertChannelMember = typeof channelMembers.$inferInsert;

/**
 * Messages table - stores all messages in channels and DMs
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  content: longtext("content").notNull(),
  authorId: int("authorId").notNull(),
  channelId: int("channelId"), // NULL for direct messages
  directMessageId: int("directMessageId"), // NULL for channel messages
  isEdited: boolean("isEdited").default(false).notNull(),
  editedAt: timestamp("editedAt"),
  isDeleted: boolean("isDeleted").default(false).notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: int("deletedBy"), // User ID who deleted the message
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  authorIdx: index("message_author_idx").on(table.authorId),
  channelIdx: index("message_channel_idx").on(table.channelId),
  directMessageIdx: index("message_dm_idx").on(table.directMessageId),
  createdAtIdx: index("message_created_at_idx").on(table.createdAt),
}));

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Read receipts table - tracks which users have read which messages
 */
export const readReceipts = mysqlTable("read_receipts", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  userId: int("userId").notNull(),
  readAt: timestamp("readAt").defaultNow().notNull(),
}, (table) => ({
  messageUserIdx: index("read_receipt_message_user_idx").on(table.messageId, table.userId),
  messageIdx: index("read_receipt_message_idx").on(table.messageId),
  userIdx: index("read_receipt_user_idx").on(table.userId),
}));

export type ReadReceipt = typeof readReceipts.$inferSelect;
export type InsertReadReceipt = typeof readReceipts.$inferInsert;

/**
 * Direct messages table - represents one-on-one conversations
 */
export const directMessages = mysqlTable("direct_messages", {
  id: int("id").autoincrement().primaryKey(),
  user1Id: int("user1Id").notNull(),
  user2Id: int("user2Id").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userPairIdx: index("dm_user_pair_idx").on(table.user1Id, table.user2Id),
  user1Idx: index("dm_user1_idx").on(table.user1Id),
  user2Idx: index("dm_user2_idx").on(table.user2Id),
}));

export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = typeof directMessages.$inferInsert;

/**
 * File attachments table - tracks files shared in messages
 */
export const fileAttachments = mysqlTable("file_attachments", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(), // S3 key
  fileUrl: text("fileUrl").notNull(), // S3 URL
  fileType: varchar("fileType", { length: 50 }).notNull(),
  fileSize: int("fileSize").notNull(), // in bytes
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  messageIdx: index("attachment_message_idx").on(table.messageId),
  uploadedByIdx: index("attachment_uploaded_by_idx").on(table.uploadedBy),
}));

export type FileAttachment = typeof fileAttachments.$inferSelect;
export type InsertFileAttachment = typeof fileAttachments.$inferInsert;

/**
 * Message reactions table - tracks emoji reactions on messages
 */
export const messageReactions = mysqlTable("message_reactions", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  userId: int("userId").notNull(),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  messageUserEmojiIdx: index("reaction_message_user_emoji_idx").on(table.messageId, table.userId, table.emoji),
  messageIdx: index("reaction_message_idx").on(table.messageId),
  userIdx: index("reaction_user_idx").on(table.userId),
}));

export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = typeof messageReactions.$inferInsert;

/**
 * Message reports table - tracks reported messages for moderation
 */
export const messageReports = mysqlTable("message_reports", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  reportedBy: int("reportedBy").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "reviewed", "resolved", "dismissed"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  action: varchar("action", { length: 50 }), // "deleted", "warned", "muted", "banned", etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  messageIdx: index("report_message_idx").on(table.messageId),
  reportedByIdx: index("report_reported_by_idx").on(table.reportedBy),
  statusIdx: index("report_status_idx").on(table.status),
}));

export type MessageReport = typeof messageReports.$inferSelect;
export type InsertMessageReport = typeof messageReports.$inferInsert;

/**
 * Moderation logs table - audit trail for all moderation actions
 */
export const moderationLogs = mysqlTable("moderation_logs", {
  id: int("id").autoincrement().primaryKey(),
  action: varchar("action", { length: 50 }).notNull(), // "mute", "unmute", "ban", "unban", "delete_message", etc.
  targetUserId: int("targetUserId"),
  targetMessageId: int("targetMessageId"),
  targetChannelId: int("targetChannelId"),
  performedBy: int("performedBy").notNull(),
  reason: text("reason"),
  details: text("details"), // JSON string with additional details
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  targetUserIdx: index("mod_log_target_user_idx").on(table.targetUserId),
  performedByIdx: index("mod_log_performed_by_idx").on(table.performedBy),
  actionIdx: index("mod_log_action_idx").on(table.action),
  createdAtIdx: index("mod_log_created_at_idx").on(table.createdAt),
}));

export type ModerationLog = typeof moderationLogs.$inferSelect;
export type InsertModerationLog = typeof moderationLogs.$inferInsert;

/**
 * Notifications table - stores notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["mention", "direct_message", "channel_invite", "moderation_action", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  relatedMessageId: int("relatedMessageId"),
  relatedUserId: int("relatedUserId"),
  relatedChannelId: int("relatedChannelId"),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("notification_user_idx").on(table.userId),
  isReadIdx: index("notification_is_read_idx").on(table.isRead),
  typeIdx: index("notification_type_idx").on(table.type),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * User permissions table - granular permission control for owners/managers
 */
export const userPermissions = mysqlTable("user_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  permission: varchar("permission", { length: 100 }).notNull(), // "manage_channels", "manage_users", "moderate_messages", etc.
  grantedBy: int("grantedBy").notNull(),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
}, (table) => ({
  userPermissionIdx: index("user_permission_idx").on(table.userId, table.permission),
  userIdx: index("user_permissions_user_idx").on(table.userId),
}));

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;
