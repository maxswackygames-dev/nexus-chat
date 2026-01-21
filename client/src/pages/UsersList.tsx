import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, Search } from "lucide-react";
import ChatLayout from "@/components/ChatLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function UsersList() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: users = [] } = trpc.users.list.useQuery();
  const getOrCreateDMMutation = trpc.directMessages.getOrCreate.useMutation();

  const filteredUsers = users.filter(
    (u) =>
      u.id !== user?.id &&
      (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStartConversation = async (userId: number) => {
    setIsLoading(true);
    try {
      const result = await new Promise<any>((resolve, reject) => {
        getOrCreateDMMutation.mutate(
          { userId },
          { onSuccess: resolve, onError: reject }
        );
      });

      setLocation(`/dms/${result.id}`);
    } catch (error) {
      toast.error("Failed to start conversation");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground">Start Conversation</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users List */}
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {users.length === 0
                      ? "No users available"
                      : "No users match your search"}
                  </CardContent>
                </Card>
              ) : (
                filteredUsers.map((u) => (
                  <Card key={u.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {u.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {u.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {u.email}
                          </p>
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            u.status === "online"
                              ? "bg-green-500"
                              : u.status === "away"
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                          }`}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartConversation(u.id)}
                        disabled={isLoading}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </ChatLayout>
  );
}
