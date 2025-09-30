// Referenced from blueprint:javascript_auth_all_persistance integration
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import Navigation from "@/components/Navigation";
import ThemeToggle from "@/components/ThemeToggle";
import Dashboard from "@/pages/Dashboard";
import AuthPage from "@/pages/auth-page";
import AdminPanel from "@/components/AdminPanel";
import NotFound from "@/pages/not-found";
import History from "@/pages/History";
import Friends from "@/pages/Friends";
import Users from "@/pages/Users";
import Directory from "@/pages/Directory";
import Companies from "@/pages/Companies";
import Investments from "@/pages/Investments";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/users" component={Users} />
      <ProtectedRoute path="/directory" component={Directory} />
      <ProtectedRoute path="/friends" component={Friends} />
      <ProtectedRoute path="/investments" component={Investments} />
      <ProtectedRoute path="/companies" component={Companies} />
      <ProtectedRoute path="/history" component={History} />
      <ProtectedRoute path="/admin" component={() => <AdminPanel />} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <Navigation />
              <div className="flex flex-col flex-1">
                <header className="flex items-center justify-between p-4 border-b">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto p-6">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
