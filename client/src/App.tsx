import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ChannelView from "./pages/ChannelView";
import DirectMessageView from "./pages/DirectMessageView";
import CreateChannel from "./pages/CreateChannel";
import UsersList from "./pages/UsersList";
import AdminDashboard from "./pages/AdminDashboard";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

function Router() {
  const { isAuthenticated, loading } = useAuth();
  const [location] = useLocation();

  // Show loading state during auth check
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Redirect to home if not authenticated and not on home page
  if (!isAuthenticated && location !== "/") {
    return <Home />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/channels/:channelId" component={ChannelView} />
      <Route path="/channels/new" component={CreateChannel} />
      <Route path="/dms/:dmId" component={DirectMessageView} />
      <Route path="/users" component={UsersList} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
