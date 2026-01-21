import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Flag,
  Check,
  CheckCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { Streamdown } from "streamdown";

interface MessageItemProps {
  id: number;
  content: string;
  author: {
    id: number;
    name: string | null;
    avatar?: string;
  };
  createdAt: Date;
  editedAt?: Date;
  isEdited?: boolean;
  isDeleted?: boolean;
  readBy?: number[];
  currentUserId: number;
  isAdmin?: boolean;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
  onReport?: () => void;
  onMarkAsRead?: () => void;
}

export default function MessageItem({
  id,
  content,
  author,
  createdAt,
  editedAt,
  isEdited,
  isDeleted,
  readBy = [],
  currentUserId,
  isAdmin,
  onEdit,
  onDelete,
  onReport,
  onMarkAsRead,
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const isOwnMessage = author.id === currentUserId;
  const canDelete = isOwnMessage || isAdmin;
  const canEdit = isOwnMessage;

  const handleSaveEdit = () => {
    if (editedContent.trim()) {
      onEdit?.(editedContent);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  if (isDeleted) {
    return (
      <div className="py-2 px-4 text-sm text-muted-foreground italic">
        Message deleted
      </div>
    );
  }

  return (
    <div className="group py-2 px-4 hover:bg-accent/50 transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
          {author.name?.[0]?.toUpperCase() || "?"}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-foreground">{author.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
            {isEdited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Input
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleSaveEdit}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-foreground break-words">
              <Streamdown>{content}</Streamdown>
            </div>
          )}

          {/* Read Receipts */}
          {readBy && readBy.length > 0 && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              {readBy.length === 1 ? (
                <>
                  <CheckCheck className="w-3 h-3" />
                  Read
                </>
              ) : (
                <>
                  <CheckCheck className="w-3 h-3" />
                  Read by {readBy.length}
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
              {!isOwnMessage && (
                <DropdownMenuItem onClick={onReport}>
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
