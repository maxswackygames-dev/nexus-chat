import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// Helper to check if user is admin or manager
const isAdminOrManager = async (userId: number) => {
  const user = await db.getUserById(userId);
  return user?.role === "admin";
};

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // User management
  users: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getUserById(input.id);
      }),

    updateStatus: protectedProcedure
      .input(z.object({ status: z.enum(["online", "offline", "away"]) }))
      .mutation(async ({ ctx, input }) => {
        // This would update user status in DB
        // For now, this is handled via WebSocket
        return { success: true };
      }),

    ban: protectedProcedure
      .input(z.object({ userId: z.number(), reason: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Check if user is admin
        if (!await isAdminOrManager(ctx.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.banUser(input.userId, input.reason);
        await db.createModerationLog(
          "ban",
          ctx.user.id,
          input.reason,
          input.userId
        );

        return { success: true };
      }),

    unban: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!await isAdminOrManager(ctx.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.unbanUser(input.userId);
        await db.createModerationLog("unban", ctx.user.id, undefined, input.userId);

        return { success: true };
      }),

    mute: protectedProcedure
      .input(z.object({ userId: z.number(), reason: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!await isAdminOrManager(ctx.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.muteUser(input.userId);
        await db.createModerationLog(
          "mute",
          ctx.user.id,
          input.reason,
          input.userId
        );

        return { success: true };
      }),

    unmute: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!await isAdminOrManager(ctx.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.unmuteUser(input.userId);
        await db.createModerationLog("unmute", ctx.user.id, undefined, input.userId);

        return { success: true };
      }),
  }),

  // Channel management
  channels: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getChannelsForUser(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getChannelById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        isPrivate: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createChannel(
          input.name,
          input.description || null,
          input.isPrivate,
          ctx.user.id
        );

        // Add creator as owner
        const channelId = (result as any).insertId as number;
        await db.addChannelMember(channelId, ctx.user.id, "owner");

        return { id: channelId, success: true };
      }),

    getMembers: protectedProcedure
      .input(z.object({ channelId: z.number() }))
      .query(async ({ input }) => {
        return await db.getChannelMembers(input.channelId);
      }),

    addMember: protectedProcedure
      .input(z.object({ channelId: z.number(), userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Check if user is channel owner/manager
        const members = await db.getChannelMembers(input.channelId);
        const userMember = members.find(m => m.member.userId === ctx.user.id);

        if (!userMember || !["owner", "manager"].includes(userMember.member.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.addChannelMember(input.channelId, input.userId, "member");

        return { success: true };
      }),
  }),

  // Messages
  messages: router({
    getChannelMessages: protectedProcedure
      .input(z.object({ 
        channelId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return await db.getChannelMessages(input.channelId, input.limit, input.offset);
      }),

    getDirectMessages: protectedProcedure
      .input(z.object({ 
        directMessageId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return await db.getDirectMessages(input.directMessageId, input.limit, input.offset);
      }),

    create: protectedProcedure
      .input(z.object({
        content: z.string().min(1),
        channelId: z.number().optional(),
        directMessageId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!input.channelId && !input.directMessageId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Either channelId or directMessageId is required" });
        }

        const result = await db.createMessage(
          input.content,
          ctx.user.id,
          input.channelId,
          input.directMessageId
        );

        return { id: (result as any).insertId, success: true };
      }),

    edit: protectedProcedure
      .input(z.object({ messageId: z.number(), content: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const message = await db.getMessageById(input.messageId);

        if (!message) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (message.authorId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.updateMessage(input.messageId, input.content);

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const message = await db.getMessageById(input.messageId);

        if (!message) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Allow author or admin to delete
        if (message.authorId !== ctx.user.id && !await isAdminOrManager(ctx.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.deleteMessage(input.messageId, ctx.user.id);

        return { success: true };
      }),

    markAsRead: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markMessageAsRead(input.messageId, ctx.user.id);
        return { success: true };
      }),

    search: protectedProcedure
      .input(z.object({ 
        query: z.string().min(1),
        channelId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.searchMessages(input.query, input.channelId);
      }),
  }),

  // Direct messages
  directMessages: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserDirectMessages(ctx.user.id);
    }),

    getOrCreate: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const dm = await db.getOrCreateDirectMessage(ctx.user.id, input.userId);
        return dm;
      }),
  }),

  // Moderation
  moderation: router({
    reportMessage: protectedProcedure
      .input(z.object({
        messageId: z.number(),
        reason: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.reportMessage(
          input.messageId,
          ctx.user.id,
          input.reason,
          input.description
        );

        return { success: true };
      }),

    getPendingReports: protectedProcedure.query(async ({ ctx }) => {
      if (!await isAdminOrManager(ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await db.getPendingReports();
    }),

    getModerationLogs: protectedProcedure.query(async ({ ctx }) => {
      if (!await isAdminOrManager(ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await db.getModerationLogs();
    }),
  }),

  // Notifications
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserNotifications(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markNotificationAsRead(input.notificationId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
