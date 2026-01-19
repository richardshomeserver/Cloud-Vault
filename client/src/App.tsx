import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

// Protected Route Wrapper
function ProtectedRoute({ component: Component, ...props }: any) {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <Component {...props} />;
}

function Router() {
  return (
    <Switch>
      {/* Public Route */}
      <Route path="/auth" component={AuthPage} />

      {/* Redirect Root to Drive */}
      <Route path="/">
        <Redirect to="/drive" />
      </Route>

      {/* Protected Routes */}
      <Route path="/drive">
        <ProtectedRoute component={() => <Dashboard category="all" />} />
      </Route>
      <Route path="/recent">
        <ProtectedRoute component={() => <Dashboard category="recent" />} />
      </Route>
      <Route path="/starred">
        <ProtectedRoute component={() => <Dashboard category="starred" />} />
      </Route>
      <Route path="/trash">
        <ProtectedRoute component={() => <Dashboard category="trash" />} />
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
