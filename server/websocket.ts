import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import * as db from "./db";

interface UserSocket {
  userId: number;
  socket: Socket;
}

interface PresenceData {
  userId: number;
  status: "online" | "offline" | "away";
  lastSeen: Date;
}

interface TypingData {
  userId: number;
  channelId?: number;
  directMessageId?: number;
}

class WebSocketManager {
  private io: SocketIOServer;
  private userSockets: Map<number, UserSocket> = new Map();
  private presenceData: Map<number, PresenceData> = new Map();
  private typingUsers: Map<string, TypingData> = new Map(); // key: "channel_${id}" or "dm_${id}"

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === "production" ? undefined : "*",
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: Socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);

      // User joins
      socket.on("user:join", (data: { userId: number }) => {
        this.handleUserJoin(socket, data.userId);
      });

      // User leaves
      socket.on("disconnect", () => {
        this.handleUserDisconnect(socket);
      });

      // Channel subscription
      socket.on("channel:join", (data: { channelId: number }) => {
        const roomName = `channel_${data.channelId}`;
        socket.join(roomName);
        console.log(`[WebSocket] User joined channel ${data.channelId}`);
      });

      socket.on("channel:leave", (data: { channelId: number }) => {
        const roomName = `channel_${data.channelId}`;
        socket.leave(roomName);
        console.log(`[WebSocket] User left channel ${data.channelId}`);
      });

      // Direct message subscription
      socket.on("dm:join", (data: { directMessageId: number }) => {
        const roomName = `dm_${data.directMessageId}`;
        socket.join(roomName);
        console.log(`[WebSocket] User joined DM ${data.directMessageId}`);
      });

      socket.on("dm:leave", (data: { directMessageId: number }) => {
        const roomName = `dm_${data.directMessageId}`;
        socket.leave(roomName);
        console.log(`[WebSocket] User left DM ${data.directMessageId}`);
      });

      // New message in channel
      socket.on("message:channel", (data: {
        channelId: number;
        messageId: number;
        content: string;
        authorId: number;
        createdAt: Date;
      }) => {
        const roomName = `channel_${data.channelId}`;
        this.io.to(roomName).emit("message:new", {
          messageId: data.messageId,
          content: data.content,
          authorId: data.authorId,
          channelId: data.channelId,
          createdAt: data.createdAt,
          isEdited: false,
        });
      });

      // New direct message
      socket.on("message:dm", (data: {
        directMessageId: number;
        messageId: number;
        content: string;
        authorId: number;
        createdAt: Date;
      }) => {
        const roomName = `dm_${data.directMessageId}`;
        this.io.to(roomName).emit("message:new", {
          messageId: data.messageId,
          content: data.content,
          authorId: data.authorId,
          directMessageId: data.directMessageId,
          createdAt: data.createdAt,
          isEdited: false,
        });
      });

      // Message edited
      socket.on("message:edit", (data: {
        messageId: number;
        content: string;
        channelId?: number;
        directMessageId?: number;
      }) => {
        const roomName = data.channelId
          ? `channel_${data.channelId}`
          : `dm_${data.directMessageId}`;

        this.io.to(roomName).emit("message:edited", {
          messageId: data.messageId,
          content: data.content,
          editedAt: new Date(),
        });
      });

      // Message deleted
      socket.on("message:delete", (data: {
        messageId: number;
        channelId?: number;
        directMessageId?: number;
      }) => {
        const roomName = data.channelId
          ? `channel_${data.channelId}`
          : `dm_${data.directMessageId}`;

        this.io.to(roomName).emit("message:deleted", {
          messageId: data.messageId,
        });
      });

      // Read receipt
      socket.on("message:read", (data: {
        messageId: number;
        userId: number;
        channelId?: number;
        directMessageId?: number;
      }) => {
        const roomName = data.channelId
          ? `channel_${data.channelId}`
          : `dm_${data.directMessageId}`;

        this.io.to(roomName).emit("message:read", {
          messageId: data.messageId,
          userId: data.userId,
          readAt: new Date(),
        });
      });

      // Typing indicator
      socket.on("typing:start", (data: {
        userId: number;
        channelId?: number;
        directMessageId?: number;
      }) => {
        const roomName = data.channelId
          ? `channel_${data.channelId}`
          : `dm_${data.directMessageId}`;

        const key = roomName;
        this.typingUsers.set(key, {
          userId: data.userId,
          channelId: data.channelId,
          directMessageId: data.directMessageId,
        });

        this.io.to(roomName).emit("typing:active", {
          userId: data.userId,
          channelId: data.channelId,
          directMessageId: data.directMessageId,
        });
      });

      socket.on("typing:stop", (data: {
        userId: number;
        channelId?: number;
        directMessageId?: number;
      }) => {
        const roomName = data.channelId
          ? `channel_${data.channelId}`
          : `dm_${data.directMessageId}`;

        const key = roomName;
        this.typingUsers.delete(key);

        this.io.to(roomName).emit("typing:inactive", {
          userId: data.userId,
          channelId: data.channelId,
          directMessageId: data.directMessageId,
        });
      });

      // User presence
      socket.on("presence:update", (data: { userId: number; status: "online" | "offline" | "away" }) => {
        this.updatePresence(data.userId, data.status);
        this.io.emit("presence:changed", {
          userId: data.userId,
          status: data.status,
          timestamp: new Date(),
        });
      });

      // File upload notification
      socket.on("file:uploaded", (data: {
        messageId: number;
        fileName: string;
        fileType: string;
        fileSize: number;
        fileUrl: string;
        channelId?: number;
        directMessageId?: number;
      }) => {
        const roomName = data.channelId
          ? `channel_${data.channelId}`
          : `dm_${data.directMessageId}`;

        this.io.to(roomName).emit("file:shared", {
          messageId: data.messageId,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
          fileUrl: data.fileUrl,
        });
      });

      // User banned notification
      socket.on("user:banned", (data: { userId: number; reason: string }) => {
        this.io.emit("moderation:user-banned", {
          userId: data.userId,
          reason: data.reason,
          timestamp: new Date(),
        });
      });

      // User muted notification
      socket.on("user:muted", (data: { userId: number; reason?: string }) => {
        this.io.emit("moderation:user-muted", {
          userId: data.userId,
          reason: data.reason,
          timestamp: new Date(),
        });
      });

      // Message reported
      socket.on("message:reported", (data: {
        messageId: number;
        reportedBy: number;
        reason: string;
      }) => {
        this.io.emit("moderation:message-reported", {
          messageId: data.messageId,
          reportedBy: data.reportedBy,
          reason: data.reason,
          timestamp: new Date(),
        });
      });

      // Error handling
      socket.on("error", (error) => {
        console.error(`[WebSocket] Socket error: ${error}`);
      });
    });
  }

  private handleUserJoin(socket: Socket, userId: number) {
    this.userSockets.set(userId, { userId, socket });
    this.updatePresence(userId, "online");

    // Notify others of user coming online
    this.io.emit("user:online", {
      userId,
      timestamp: new Date(),
    });

    console.log(`[WebSocket] User ${userId} joined`);
  }

  private handleUserDisconnect(socket: Socket) {
    // Find and remove user
    const entries = Array.from(this.userSockets.entries());
    for (const [userId, userSocket] of entries) {
      if (userSocket.socket.id === socket.id) {
        this.userSockets.delete(userId);
        this.updatePresence(userId, "offline");

        this.io.emit("user:offline", {
          userId,
          timestamp: new Date(),
        });

        console.log(`[WebSocket] User ${userId} disconnected`);
        break;
      }
    }
  }

  private updatePresence(userId: number, status: "online" | "offline" | "away") {
    this.presenceData.set(userId, {
      userId,
      status,
      lastSeen: new Date(),
    });
  }

  public getPresence(userId: number): PresenceData | undefined {
    return this.presenceData.get(userId);
  }

  public getOnlineUsers(): number[] {
    const onlineUsers: number[] = [];
    const entries = Array.from(this.presenceData.entries());
    for (const [userId, presence] of entries) {
      if (presence.status === "online") {
        onlineUsers.push(userId);
      }
    }
    return onlineUsers;
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default WebSocketManager;
