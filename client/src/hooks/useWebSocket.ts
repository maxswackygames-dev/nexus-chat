import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebSocketOptions {
  userId?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!options.userId) return;

    // Connect to WebSocket server
    const socket = io(window.location.origin as string, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WebSocket] Connected");
      socket.emit("user:join", { userId: options.userId });
      options.onConnect?.();
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
      options.onDisconnect?.();
    });

    socket.on("error", (error) => {
      console.error("[WebSocket] Error:", error);
      options.onError?.(error);
    });

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socket.disconnect();
    };
  }, [options.userId]);

  const joinChannel = useCallback((channelId: number) => {
    socketRef.current?.emit("channel:join", { channelId });
  }, []);

  const leaveChannel = useCallback((channelId: number) => {
    socketRef.current?.emit("channel:leave", { channelId });
  }, []);

  const joinDirectMessage = useCallback((directMessageId: number) => {
    socketRef.current?.emit("dm:join", { directMessageId });
  }, []);

  const leaveDirectMessage = useCallback((directMessageId: number) => {
    socketRef.current?.emit("dm:leave", { directMessageId });
  }, []);

  const sendChannelMessage = useCallback((data: {
    channelId: number;
    messageId: number;
    content: string;
    authorId: number;
    createdAt: Date;
  }) => {
    socketRef.current?.emit("message:channel", data);
  }, []);

  const sendDirectMessage = useCallback((data: {
    directMessageId: number;
    messageId: number;
    content: string;
    authorId: number;
    createdAt: Date;
  }) => {
    socketRef.current?.emit("message:dm", data);
  }, []);

  const editMessage = useCallback((data: {
    messageId: number;
    content: string;
    channelId?: number;
    directMessageId?: number;
  }) => {
    socketRef.current?.emit("message:edit", data);
  }, []);

  const deleteMessage = useCallback((data: {
    messageId: number;
    channelId?: number;
    directMessageId?: number;
  }) => {
    socketRef.current?.emit("message:delete", data);
  }, []);

  const markMessageAsRead = useCallback((data: {
    messageId: number;
    userId: number;
    channelId?: number;
    directMessageId?: number;
  }) => {
    socketRef.current?.emit("message:read", data);
  }, []);

  const startTyping = useCallback((data: {
    userId: number;
    channelId?: number;
    directMessageId?: number;
  }) => {
    socketRef.current?.emit("typing:start", data);
  }, []);

  const stopTyping = useCallback((data: {
    userId: number;
    channelId?: number;
    directMessageId?: number;
  }) => {
    socketRef.current?.emit("typing:stop", data);
  }, []);

  const updatePresence = useCallback((data: {
    userId: number;
    status: "online" | "offline" | "away";
  }) => {
    socketRef.current?.emit("presence:update", data);
  }, []);

  const notifyFileUploaded = useCallback((data: {
    messageId: number;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    channelId?: number;
    directMessageId?: number;
  }) => {
    socketRef.current?.emit("file:uploaded", data);
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.off(event, callback);
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return {
    socket: socketRef.current,
    joinChannel,
    leaveChannel,
    joinDirectMessage,
    leaveDirectMessage,
    sendChannelMessage,
    sendDirectMessage,
    editMessage,
    deleteMessage,
    markMessageAsRead,
    startTyping,
    stopTyping,
    updatePresence,
    notifyFileUploaded,
    on,
    off,
    emit,
  };
}
