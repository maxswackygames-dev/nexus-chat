import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  onFileSelect?: (file: File) => Promise<void>;
  channelId?: number;
  directMessageId?: number;
  userId?: number;
  isLoading?: boolean;
}

export default function MessageInput({
  onSendMessage,
  onFileSelect,
  channelId,
  directMessageId,
  userId,
  isLoading,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isTypingRef = useRef(false);

  const { startTyping, stopTyping } = useWebSocket({ userId });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(
        textareaRef.current.scrollHeight,
        120
      ) + "px";
    }
  }, [content]);

  const handleTyping = () => {
    if (!isTypingRef.current && userId) {
      isTypingRef.current = true;
      startTyping({
        userId,
        channelId,
        directMessageId,
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      stopTyping({
        userId: userId || 0,
        channelId,
        directMessageId,
      });
    }, 3000);
  };

  const handleSendMessage = async () => {
    if (!content.trim() || isSending || isLoading) return;

    setIsSending(true);
    try {
      await onSendMessage(content);
      setContent("");
      
      // Stop typing indicator
      isTypingRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping({
        userId: userId || 0,
        channelId,
        directMessageId,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      try {
        await onFileSelect(file);
      } catch (error) {
        console.error("Failed to upload file:", error);
      }
    }
  };

  return (
    <div className="p-4 border-t border-border bg-card space-y-2">
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          placeholder="Type a message... (Shift+Enter for new line)"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          disabled={isLoading || isSending}
          className="resize-none max-h-[120px]"
          rows={1}
        />
        <div className="flex flex-col gap-2">
          <label>
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading || isSending}
            />
            <Button
              variant="outline"
              size="icon"
              asChild
              disabled={isLoading || isSending}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </label>
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!content.trim() || isLoading || isSending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}
