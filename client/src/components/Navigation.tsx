import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader } from "@/components/ui/sidebar";
import { Wallet, Users, TrendingUp, History, Building, Star, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Wallet },
  { title: "Friends", url: "/friends", icon: Users },
  { title: "Investments", url: "/investments", icon: TrendingUp },
  { title: "Companies", url: "/companies", icon: Building },
  { title: "History", url: "/history", icon: History },
];

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Star className="w-8 h-8 text-accent" />
          <div>
            <h1 className="font-bold text-lg">Astra Nova</h1>
            <p className="text-sm text-muted-foreground">Currency Platform</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {user?.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === "/admin"}
                    data-testid="link-admin"
                  >
                    <Link href="/admin">
                      <Settings className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}