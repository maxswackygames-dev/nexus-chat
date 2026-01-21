import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Settings, Info, ChevronDown } from "lucide-react";
import ChatLayout from "@/components/ChatLayout";
import MessageItem from "@/components/MessageItem";
import MessageInput from "@/components/MessageInput";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function DirectMessageView() {
  const { dmId } = useParams<{ dmId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

  const numDmId = dmId ? parseInt(dmId) : 0;

  // Fetch messages
  const { data: messageData = [] } = trpc.messages.getDirectMessages.useQuery(
    { directMessageId: numDmId, limit: 50 },
    { enabled: !!numDmId }
  );

  // WebSocket setup
  const {
    joinDirectMessage,
    leaveDirectMessage,
    sendDirectMessage,
    editMessage,
    deleteMessage,
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

      // Determine other user
      const firstMessage = messageData[0];
      if (firstMessage.author.id !== user?.id) {
        setOtherUser(firstMessage.author);
      }
    }
  }, [messageData, user?.id]);

  // Join DM on mount
  useEffect(() => {
    if (numDmId) {
      joinDirectMessage(numDmId);

      return () => {
        leaveDirectMessage(numDmId);
      };
    }
  }, [numDmId, joinDirectMessage, leaveDirectMessage]);

  // Setup WebSocket listeners
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (data.directMessageId === numDmId) {
        setMessages((prev) => [...prev, data]);
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
      if (data.directMessageId === numDmId) {
        setTypingUsers((prev) => new Set([...Array.from(prev), data.userId]));
      }
    };

    const handleStopTyping = (data: any) => {
      if (data.directMessageId === numDmId) {
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
  }, [numDmId, on, off]);

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
      const result = await new Promise<any>((resolve, reject) => {
        const mutation = trpc.messages.create.useMutation();
        mutation.mutate(
          { content, directMessageId: numDmId },
          { onSuccess: resolve, onError: reject }
        );
      });

      sendDirectMessage({
        directMessageId: numDmId,
        messageId: result.id,
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
      const mutation = trpc.messages.edit.useMutation();
      await new Promise((resolve, reject) => {
        mutation.mutate(
          { messageId, content },
          { onSuccess: resolve, onError: reject }
        );
      });
      editMessage({
        messageId,
        content,
        directMessageId: numDmId,
      });
    } catch (error) {
      toast.error("Failed to edit message");
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const mutation = trpc.messages.delete.useMutation();
      await new Promise((resolve, reject) => {
        mutation.mutate(
          { messageId },
          { onSuccess: resolve, onError: reject }
        );
      });
      deleteMessage({
        messageId,
        directMessageId: numDmId,
      });
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  if (!otherUser) {
    return (
      <ChatLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading conversation...</div>
        </div>
      </ChatLayout>
    );
  }

  return (
    <ChatLayout>
      <div className="flex flex-col h-full">
        {/* DM Header */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
              {otherUser.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {otherUser.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {otherUser.status === "online" ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Info className="w-4 h-4" />
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
                Start a conversation with {otherUser.name}
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
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="px-4 py-2 text-xs text-muted-foreground">
            {otherUser.name} is typing...
          </div>
        )}

        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          directMessageId={numDmId}
          userId={user?.id}
        />
      </div>
    </ChatLayout>
  );
}
