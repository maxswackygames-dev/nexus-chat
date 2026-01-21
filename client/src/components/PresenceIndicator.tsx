import { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface PresenceIndicatorProps {
  userId: number;
  userName?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function PresenceIndicator({
  userId,
  userName,
  size = "md",
  showLabel = false,
}: PresenceIndicatorProps) {
  const [status, setStatus] = useState<"online" | "offline" | "away">("offline");
  const { on, off } = useWebSocket({});

  useEffect(() => {
    const handlePresenceChange = (data: any) => {
      if (data.userId === userId) {
        setStatus(data.status);
      }
    };

    on("presence:changed", handlePresenceChange);

    return () => {
      off("presence:changed", handlePresenceChange);
    };
  }, [userId, on, off]);

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const statusColors = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-400",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} ${statusColors[status]} rounded-full animate-pulse`}
        title={`${userName || "User"} is ${status}`}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground capitalize">{status}</span>
      )}
    </div>
  );
}
