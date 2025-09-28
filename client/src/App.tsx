import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Navigation from "@/components/Navigation";
import ThemeToggle from "@/components/ThemeToggle";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/friends" component={() => <div className="p-8"><h1 className="text-2xl font-bold">Friends Page</h1><p>Coming soon...</p></div>} />
      <Route path="/investments" component={() => <div className="p-8"><h1 className="text-2xl font-bold">Investments Page</h1><p>Coming soon...</p></div>} />
      <Route path="/companies" component={() => <div className="p-8"><h1 className="text-2xl font-bold">Companies Page</h1><p>Coming soon...</p></div>} />
      <Route path="/history" component={() => <div className="p-8"><h1 className="text-2xl font-bold">Transaction History</h1><p>Coming soon...</p></div>} />
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
    </QueryClientProvider>
  );
}
