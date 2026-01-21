import { useState } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Shield,
  AlertCircle,
  MoreVertical,
  Ban,
  Volume2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import ChatLayout from "@/components/ChatLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("users");

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <ChatLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access the admin dashboard.
          </p>
          <Button onClick={() => setLocation("/")}>Go Back</Button>
        </div>
      </ChatLayout>
    );
  }

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
          <Shield className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-foreground">Admin Dashboard</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <UsersManagement />
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4">
              <ReportsManagement />
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="space-y-4">
              <ModerationLogs />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ChatLayout>
  );
}

function UsersManagement() {
  const { data: users = [] } = trpc.users.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const banMutation = trpc.users.ban.useMutation();
  const unbanMutation = trpc.users.unban.useMutation();
  const muteMutation = trpc.users.mute.useMutation();
  const unmuteMutation = trpc.users.unmute.useMutation();

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBanUser = async (userId: number, reason: string) => {
    setIsLoading(true);
    try {
      await new Promise((resolve, reject) => {
        banMutation.mutate(
          { userId, reason },
          { onSuccess: resolve, onError: reject }
        );
      });
      toast.success("User banned successfully");
    } catch (error) {
      toast.error("Failed to ban user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbanUser = async (userId: number) => {
    setIsLoading(true);
    try {
      await new Promise((resolve, reject) => {
        unbanMutation.mutate(
          { userId },
          { onSuccess: resolve, onError: reject }
        );
      });
      toast.success("User unbanned successfully");
    } catch (error) {
      toast.error("Failed to unban user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMuteUser = async (userId: number, reason?: string) => {
    setIsLoading(true);
    try {
      await new Promise((resolve, reject) => {
        muteMutation.mutate(
          { userId, reason },
          { onSuccess: resolve, onError: reject }
        );
      });
      toast.success("User muted successfully");
    } catch (error) {
      toast.error("Failed to mute user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnmuteUser = async (userId: number) => {
    setIsLoading(true);
    try {
      await new Promise((resolve, reject) => {
        unmuteMutation.mutate(
          { userId },
          { onSuccess: resolve, onError: reject }
        );
      });
      toast.success("User unmuted successfully");
    } catch (error) {
      toast.error("Failed to unmute user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user permissions and moderation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <ScrollArea className="h-96 border rounded-lg p-4">
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{u.name}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    <div className="flex gap-2 mt-2">
                      {u.role === "admin" && (
                        <Badge variant="default">Admin</Badge>
                      )}
                      {u.isBanned && (
                        <Badge variant="destructive">Banned</Badge>
                      )}
                      {u.isMuted && (
                        <Badge variant="secondary">Muted</Badge>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isLoading}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {u.isBanned ? (
                        <DropdownMenuItem
                          onClick={() => handleUnbanUser(u.id)}
                        >
                          Unban User
                        </DropdownMenuItem>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Ban User
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Ban User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to ban {u.name}? They will not be able to access the platform.
                            </AlertDialogDescription>
                            <div className="space-y-4 py-4">
                              <Input placeholder="Reason for ban" />
                            </div>
                            <div className="flex gap-2">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleBanUser(u.id, "Policy violation")
                                }
                                className="bg-destructive"
                              >
                                Ban
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {u.isMuted ? (
                        <DropdownMenuItem
                          onClick={() => handleUnmuteUser(u.id)}
                        >
                          Unmute User
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleMuteUser(u.id)}
                        >
                          <Volume2 className="w-4 h-4 mr-2" />
                          Mute User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsManagement() {
  const { data: reports = [] } = trpc.moderation.getPendingReports.useQuery();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Message Reports</CardTitle>
          <CardDescription>Review and manage reported messages</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 border rounded-lg p-4">
            {reports.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No pending reports
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((r: any) => (
                  <div
                    key={r.report.id}
                    className="p-4 rounded-lg border border-border space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {r.report.reason}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Reported by {r.reporter.name}
                        </p>
                      </div>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                    {r.report.description && (
                      <p className="text-sm text-foreground">
                        {r.report.description}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Message: "{r.message.content.substring(0, 100)}..."
                    </p>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline">
                        Dismiss
                      </Button>
                      <Button size="sm" variant="destructive">
                        Delete Message
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function ModerationLogs() {
  const { data: logs = [] } = trpc.moderation.getModerationLogs.useQuery();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Moderation Logs</CardTitle>
          <CardDescription>Audit trail of all moderation actions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 border rounded-lg p-4">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No moderation logs
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log: any) => (
                  <div
                    key={log.log.id}
                    className="p-3 rounded-lg border border-border text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground capitalize">
                          {log.log.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          By {log.performer?.name || "Unknown"}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {new Date(log.log.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                    {log.log.reason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Reason: {log.log.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
