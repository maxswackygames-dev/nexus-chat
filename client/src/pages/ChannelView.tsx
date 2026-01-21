import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Settings, Users, ChevronDown } from "lucide-react";
import ChatLayout from "@/components/ChatLayout";
import MessageItem from "@/components/MessageItem";
import MessageInput from "@/components/MessageInput";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ChannelView() {
  const { channelId } = useParams<{ channelId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

  const numChannelId = channelId ? parseInt(channelId) : 0;

  // Fetch channel info
  const { data: channel } = trpc.channels.getById.useQuery(
    { id: numChannelId },
    { enabled: !!numChannelId }
  );

  // Fetch messages
  const { data: messageData = [] } = trpc.messages.getChannelMessages.useQuery(
    { channelId: numChannelId, limit: 50 },
    { enabled: !!numChannelId }
  );

  // WebSocket setup
  const {
    joinChannel,
    leaveChannel,
    sendChannelMessage,
    editMessage,
    deleteMessage,
    markMessageAsRead,
    on,
    off,
  } = useWebSocket({ userId: user?.id });

  // Initialize messages
  useEffect(() => {
    if (messageData && messageData.length > 0) {
      setMessages(
        messageData.map((m: any) => ({
          id: m.message.id,
          content: m.message.content,
          author: m.author,
          createdAt: m.message.createdAt,
          editedAt: m.message.editedAt,
          isEdited: m.message.isEdited,
          isDeleted: m.message.isDeleted,
        }))
      );
    }
  }, [messageData]);

  // Join channel on mount
  useEffect(() => {
    if (numChannelId) {
      joinChannel(numChannelId);

      return () => {
        leaveChannel(numChannelId);
      };
    }
  }, [numChannelId, joinChannel, leaveChannel]);

  // Setup WebSocket listeners
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (data.channelId === numChannelId) {
        setMessages((prev) => [...prev, data]);
        // Auto scroll to bottom
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
          });
        }, 0);
      }
    };

    const handleMessageEdited = (data: any) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, content: data.content, editedAt: data.editedAt }
            : m
        )
      );
    };

    const handleMessageDeleted = (data: any) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, isDeleted: true } : m
        )
      );
    };

    const handleTyping = (data: any) => {
      if (data.channelId === numChannelId) {
        setTypingUsers((prev) => new Set([...Array.from(prev), data.userId]));
      }
    };

    const handleStopTyping = (data: any) => {
      if (data.channelId === numChannelId) {
        setTypingUsers((prev) => {
          const newSet = new Set(Array.from(prev));
          newSet.delete(data.userId);
          return newSet;
        });
      }
    };

    on("message:new", handleNewMessage);
    on("message:edited", handleMessageEdited);
    on("message:deleted", handleMessageDeleted);
    on("typing:active", handleTyping);
    on("typing:inactive", handleStopTyping);

    return () => {
      off("message:new", handleNewMessage);
      off("message:edited", handleMessageEdited);
      off("message:deleted", handleMessageDeleted);
      off("typing:active", handleTyping);
      off("typing:inactive", handleStopTyping);
    };
  }, [numChannelId, on, off]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!user?.id) return;

    try {
      const result = await trpc.messages.create.useMutation();
      const mutationResult = await new Promise((resolve, reject) => {
        result.mutate(
          { content, channelId: numChannelId },
          { onSuccess: resolve, onError: reject }
        );
      });

      sendChannelMessage({
        channelId: numChannelId,
        messageId: (mutationResult as any).id,
        content,
        authorId: user.id,
        createdAt: new Date(),
      });
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleEditMessage = async (messageId: number, content: string) => {
    try {
      const result = trpc.messages.edit.useMutation();
      await new Promise((resolve, reject) => {
        result.mutate(
          { messageId, content },
          { onSuccess: resolve, onError: reject }
        );
      });
      editMessage({
        messageId,
        content,
        channelId: numChannelId,
      });
    } catch (error) {
      toast.error("Failed to edit message");
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const result = trpc.messages.delete.useMutation();
      await new Promise((resolve, reject) => {
        result.mutate(
          { messageId },
          { onSuccess: resolve, onError: reject }
        );
      });
      deleteMessage({
        messageId,
        channelId: numChannelId,
      });
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const handleReportMessage = async (messageId: number) => {
    setLocation(`/report/${messageId}`);
  };

  if (!channel) {
    return (
      <ChatLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading channel...</div>
        </div>
      </ChatLayout>
    );
  }

  return (
    <ChatLayout>
      <div className="flex flex-col h-full">
        {/* Channel Header */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {channel.isPrivate ? "🔒" : "#"} {channel.name}
            </h2>
            {channel.description && (
              <p className="text-sm text-muted-foreground">{channel.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Users className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="space-y-0">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  id={msg.id}
                  content={msg.content}
                  author={msg.author}
                  createdAt={msg.createdAt}
                  editedAt={msg.editedAt}
                  isEdited={msg.isEdited}
                  isDeleted={msg.isDeleted}
                  currentUserId={user?.id || 0}
                  isAdmin={user?.role === "admin"}
                  onEdit={(content) => handleEditMessage(msg.id, content)}
                  onDelete={() => handleDeleteMessage(msg.id)}
                  onReport={() => handleReportMessage(msg.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="px-4 py-2 text-xs text-muted-foreground">
            {Array.from(typingUsers).length} user{Array.from(typingUsers).length !== 1 ? "s" : ""} typing...
          </div>
        )}

        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          channelId={numChannelId}
          userId={user?.id}
        />
      </div>
    </ChatLayout>
  );
}
