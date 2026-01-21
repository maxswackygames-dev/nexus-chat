import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import ChatLayout from "@/components/ChatLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CreateChannel() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const createChannelMutation = trpc.channels.create.useMutation();

  const handleCreateChannel = async () => {
    if (!name.trim()) {
      toast.error("Channel name is required");
      return;
    }

    setIsLoading(true);
    try {
      const result = await new Promise<any>((resolve, reject) => {
        createChannelMutation.mutate(
          {
            name: name.trim(),
            description: description.trim() || undefined,
            isPrivate,
          },
          { onSuccess: resolve, onError: reject }
        );
      });

      toast.success("Channel created successfully");
      setLocation(`/channels/${result.id}`);
    } catch (error) {
      toast.error("Failed to create channel");
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
          <h2 className="text-lg font-semibold text-foreground">Create Channel</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>New Channel</CardTitle>
                <CardDescription>
                  Create a new channel for team communication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Channel Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Channel Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., marketing, engineering"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Channel names are lowercase and cannot contain spaces
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this channel about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
                    rows={3}
                  />
                </div>

                {/* Private Toggle */}
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <Label htmlFor="private" className="cursor-pointer">
                      Private Channel
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Only invited members can access
                    </p>
                  </div>
                  <Switch
                    id="private"
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                    disabled={isLoading}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setLocation("/")}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCreateChannel}
                    disabled={isLoading || !name.trim()}
                  >
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Channel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ChatLayout>
  );
}
