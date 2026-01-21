import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import ChatLayout from "@/components/ChatLayout";
import { MessageSquare, Users, Lock, Zap } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // If authenticated, show chat layout
  if (isAuthenticated && user) {
    return (
      <ChatLayout>
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-background to-card">
          <div className="text-center space-y-4">
            <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground" />
            <h1 className="text-3xl font-bold text-foreground">Welcome to Nexus Chat</h1>
            <p className="text-muted-foreground max-w-md">
              Select a channel or direct message to start chatting. Create a new channel to bring your team together.
            </p>
            <div className="flex gap-2 justify-center pt-4">
              <Button
                onClick={() => setLocation("/channels/new")}
                variant="default"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Create Channel
              </Button>
              <Button
                onClick={() => setLocation("/users")}
                variant="outline"
              >
                <Users className="w-4 h-4 mr-2" />
                Start DM
              </Button>
            </div>
          </div>
        </div>
      </ChatLayout>
    );
  }

  // If loading, show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If not authenticated, show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-bold text-foreground">Nexus Chat</span>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-20 text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Better Communication,
            <span className="block text-blue-500">Smarter Collaboration</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Nexus Chat brings your team together with real-time messaging, powerful moderation tools, and advanced administrative controls.
          </p>
        </div>

        <div className="flex gap-4 justify-center pt-4">
          <Button size="lg" asChild>
            <a href={getLoginUrl()}>Get Started</a>
          </Button>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Powerful Features for Teams
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
            <MessageSquare className="w-8 h-8 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Real-Time Messaging
            </h3>
            <p className="text-muted-foreground">
              Instant message delivery with read receipts, typing indicators, and message editing.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
            <Users className="w-8 h-8 text-purple-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Team Organization
            </h3>
            <p className="text-muted-foreground">
              Create channels and direct messages to organize conversations and keep teams aligned.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
            <Lock className="w-8 h-8 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Advanced Moderation
            </h3>
            <p className="text-muted-foreground">
              Powerful admin controls for managing users, moderating content, and maintaining order.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
            <Zap className="w-8 h-8 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              File Sharing
            </h3>
            <p className="text-muted-foreground">
              Share files, images, and documents directly in conversations with secure storage.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
            <MessageSquare className="w-8 h-8 text-pink-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Notifications
            </h3>
            <p className="text-muted-foreground">
              Stay updated with smart notifications for mentions, direct messages, and important events.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
            <Users className="w-8 h-8 text-indigo-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              User Management
            </h3>
            <p className="text-muted-foreground">
              Complete control over user permissions, roles, and access levels without external tools.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="p-8 rounded-lg border border-border bg-card/50 backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your Team Communication?
          </h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of teams using Nexus Chat for better collaboration and communication.
          </p>
          <Button size="lg" asChild>
            <a href={getLoginUrl()}>Start Free Today</a>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2026 Nexus Chat. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
