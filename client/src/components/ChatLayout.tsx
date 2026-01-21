import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Users,
  MessageSquare,
  Shield,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface ChatLayoutProps {
  children?: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"channels" | "dms">("channels");

  const { joinChannel, leaveChannel, updatePresence } = useWebSocket({
    userId: user?.id,
  });

  // Fetch channels and DMs
  const { data: channels = [] } = trpc.channels.list.useQuery();
  const { data: directMessages = [] } = trpc.directMessages.list.useQuery();

  // Update presence when component mounts
  useEffect(() => {
    if (user?.id) {
      updatePresence({ userId: user.id, status: "online" });
    }

    return () => {
      if (user?.id) {
        updatePresence({ userId: user.id, status: "offline" });
      }
    };
  }, [user?.id, updatePresence]);

  const handleChannelClick = (channelId: number) => {
    setLocation(`/channels/${channelId}`);
  };

  const handleDMClick = (dmId: number) => {
    setLocation(`/dms/${dmId}`);
  };

  const handleCreateChannel = () => {
    setLocation("/channels/new");
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } border-r border-border bg-card transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-foreground">Nexus Chat</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "channels" | "dms")} className="flex-1 flex flex-col">
          <TabsList className="w-full rounded-none border-b border-border">
            <TabsTrigger value="channels" className="flex-1">
              <MessageSquare className="w-4 h-4 mr-2" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="dms" className="flex-1">
              <Users className="w-4 h-4 mr-2" />
              Direct
            </TabsTrigger>
          </TabsList>

          {/* Channels Tab */}
          <TabsContent value="channels" className="flex-1 flex flex-col m-0">
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {channels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => handleChannelClick(channel.id)}
                  >
                    <span className="truncate">
                      {channel.isPrivate ? "🔒" : "#"} {channel.name}
                    </span>
                  </Button>
                ))}
              </div>
            </ScrollArea>

            <div className="p-2 border-t border-border">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCreateChannel}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Channel
              </Button>
            </div>
          </TabsContent>

          {/* Direct Messages Tab */}
          <TabsContent value="dms" className="flex-1 flex flex-col m-0">
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {directMessages.map((dm) => (
                  <Button
                    key={dm.dm.id}
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => handleDMClick(dm.dm.id)}
                  >
                    <span className="truncate">{dm.otherUser.name}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <div className="text-sm text-muted-foreground truncate">
            {user?.name}
          </div>
          <div className="flex gap-2">
            {user?.role === "admin" && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setLocation("/admin")}
                title="Admin Dashboard"
              >
                <Shield className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => setLocation("/settings")}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Toggle */}
        <div className="lg:hidden p-4 border-b border-border flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">Nexus Chat</span>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
