import { eq, and, or, desc, asc, inArray, isNull, isNotNull, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  channels,
  channelMembers,
  messages,
  readReceipts,
  directMessages,
  fileAttachments,
  messageReactions,
  messageReports,
  moderationLogs,
  notifications,
  userPermissions,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(users).orderBy(asc(users.name));
}

// Channel queries
export async function createChannel(name: string, description: string | null, isPrivate: boolean, ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(channels).values({
    name,
    description,
    isPrivate,
    ownerId,
  });
  
  return result;
}

export async function getChannelById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllChannels() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(channels).where(eq(channels.isArchived, false)).orderBy(asc(channels.name));
}

export async function getChannelsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    channel: channels,
    member: channelMembers,
  })
  .from(channels)
  .innerJoin(channelMembers, eq(channels.id, channelMembers.channelId))
  .where(eq(channelMembers.userId, userId))
  .orderBy(asc(channels.name));
  
  return result.map(r => r.channel);
}

export async function addChannelMember(channelId: number, userId: number, role: "owner" | "manager" | "member" = "member") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(channelMembers).values({
    channelId,
    userId,
    role,
  });
}

export async function getChannelMembers(channelId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    member: channelMembers,
    user: users,
  })
  .from(channelMembers)
  .innerJoin(users, eq(channelMembers.userId, users.id))
  .where(eq(channelMembers.channelId, channelId))
  .orderBy(asc(users.name));
  
  return result;
}

// Message queries
export async function createMessage(content: string, authorId: number, channelId?: number, directMessageId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(messages).values({
    content,
    authorId,
    channelId: channelId || null,
    directMessageId: directMessageId || null,
  });
  
  return result;
}

export async function getChannelMessages(channelId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    message: messages,
    author: users,
  })
  .from(messages)
  .innerJoin(users, eq(messages.authorId, users.id))
  .where(and(
    eq(messages.channelId, channelId),
    eq(messages.isDeleted, false)
  ))
  .orderBy(desc(messages.createdAt))
  .limit(limit)
  .offset(offset);
}

export async function getDirectMessages(dmId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    message: messages,
    author: users,
  })
  .from(messages)
  .innerJoin(users, eq(messages.authorId, users.id))
  .where(and(
    eq(messages.directMessageId, dmId),
    eq(messages.isDeleted, false)
  ))
  .orderBy(desc(messages.createdAt))
  .limit(limit)
  .offset(offset);
}

export async function getMessageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateMessage(id: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(messages)
    .set({ content, isEdited: true, editedAt: new Date() })
    .where(eq(messages.id, id));
}

export async function deleteMessage(id: number, deletedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(messages)
    .set({ isDeleted: true, deletedAt: new Date(), deletedBy })
    .where(eq(messages.id, id));
}

// Read receipts
export async function markMessageAsRead(messageId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(readReceipts).values({
    messageId,
    userId,
  }).onDuplicateKeyUpdate({
    set: { readAt: new Date() },
  });
}

export async function getReadReceipts(messageId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(readReceipts).where(eq(readReceipts.messageId, messageId));
}

// Direct messages
export async function getOrCreateDirectMessage(user1Id: number, user2Id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [smaller, larger] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
  
  const existing = await db.select().from(directMessages)
    .where(and(
      eq(directMessages.user1Id, smaller),
      eq(directMessages.user2Id, larger)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  const result = await db.insert(directMessages).values({
    user1Id: smaller,
    user2Id: larger,
  });
  
  return await db.select().from(directMessages)
    .where(and(
      eq(directMessages.user1Id, smaller),
      eq(directMessages.user2Id, larger)
    ))
    .limit(1)
    .then(r => r[0]);
}

export async function getUserDirectMessages(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    dm: directMessages,
    otherUser: users,
  })
  .from(directMessages)
  .innerJoin(users, or(
    and(eq(directMessages.user1Id, userId), eq(users.id, directMessages.user2Id)),
    and(eq(directMessages.user2Id, userId), eq(users.id, directMessages.user1Id))
  ))
  .orderBy(desc(directMessages.updatedAt));
  
  return result;
}

// Moderation
export async function banUser(userId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(users)
    .set({ isBanned: true, bannedReason: reason, bannedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function unbanUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(users)
    .set({ isBanned: false, bannedReason: null, bannedAt: null })
    .where(eq(users.id, userId));
}

export async function muteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(users)
    .set({ isMuted: true })
    .where(eq(users.id, userId));
}

export async function unmuteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(users)
    .set({ isMuted: false })
    .where(eq(users.id, userId));
}

// Notifications
export async function createNotification(
  userId: number,
  type: "mention" | "direct_message" | "channel_invite" | "moderation_action" | "system",
  title: string,
  content?: string,
  relatedMessageId?: number,
  relatedUserId?: number,
  relatedChannelId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(notifications).values({
    userId,
    type,
    title,
    content: content || null,
    relatedMessageId: relatedMessageId || null,
    relatedUserId: relatedUserId || null,
    relatedChannelId: relatedChannelId || null,
  });
}

export async function getUserNotifications(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.id, notificationId));
}

// Message reports
export async function reportMessage(messageId: number, reportedBy: number, reason: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(messageReports).values({
    messageId,
    reportedBy,
    reason,
    description: description || null,
  });
}

export async function getPendingReports() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    report: messageReports,
    message: messages,
    reporter: users,
  })
  .from(messageReports)
  .innerJoin(messages, eq(messageReports.messageId, messages.id))
  .innerJoin(users, eq(messageReports.reportedBy, users.id))
  .where(eq(messageReports.status, "pending"))
  .orderBy(asc(messageReports.createdAt));
  
  return result;
}

// Moderation logs
export async function createModerationLog(
  action: string,
  performedBy: number,
  reason?: string,
  targetUserId?: number,
  targetMessageId?: number,
  targetChannelId?: number,
  details?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(moderationLogs).values({
    action,
    performedBy,
    reason: reason || null,
    targetUserId: targetUserId || null,
    targetMessageId: targetMessageId || null,
    targetChannelId: targetChannelId || null,
    details: details || null,
  });
}

export async function getModerationLogs(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    log: moderationLogs,
    performer: users,
    targetUser: users,
  })
  .from(moderationLogs)
  .leftJoin(users, eq(moderationLogs.performedBy, users.id))
  .orderBy(desc(moderationLogs.createdAt))
  .limit(limit);
}

// File attachments
export async function createFileAttachment(
  messageId: number,
  fileName: string,
  fileKey: string,
  fileUrl: string,
  fileType: string,
  fileSize: number,
  uploadedBy: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(fileAttachments).values({
    messageId,
    fileName,
    fileKey,
    fileUrl,
    fileType,
    fileSize,
    uploadedBy,
  });
}

export async function getFileAttachments(messageId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(fileAttachments).where(eq(fileAttachments.messageId, messageId));
}

// Search messages
export async function searchMessages(query: string, channelId?: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    like(messages.content, `%${query}%`),
    eq(messages.isDeleted, false),
  ];
  
  if (channelId) {
    conditions.push(eq(messages.channelId, channelId));
  }
  
  return await db.select({
    message: messages,
    author: users,
  })
  .from(messages)
  .innerJoin(users, eq(messages.authorId, users.id))
  .where(and(...conditions))
  .orderBy(desc(messages.createdAt))
  .limit(limit);
}
