import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "wouter";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex items-center gap-2">
      {user?.isAdmin && (
        <Badge variant="secondary" className="mr-2" data-testid="badge-admin">
          <Settings className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        data-testid="button-theme-toggle"
      >
        {theme === 'light' ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4" />
        )}
      </Button>

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-user-menu">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs">
                  {user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline font-mono">
                {user.balance.toLocaleString()} ⭐
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {user.balance.toLocaleString()} Astras
              </p>
            </div>
            <DropdownMenuSeparator />
            {user.isAdmin && (
              <>
                <DropdownMenuItem onClick={() => setLocation('/admin')} data-testid="menu-admin-panel">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Panel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}