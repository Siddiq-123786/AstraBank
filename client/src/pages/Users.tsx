import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users as UsersIcon, Star, UserPlus, Crown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type UserProfile = {
  id: string;
  email: string;
  balance: number;
  isAdmin: boolean;
  createdAt: string;
};

function getUserInitials(email: string): string {
  const username = email.split('@')[0];
  return username.slice(0, 2).toUpperCase();
}

function getUsername(email: string): string {
  return email.split('@')[0];
}

export default function Users() {
  const { user: currentUser } = useAuth();
  
  const { data: users = [], isLoading, error } = useQuery<UserProfile[]>({
    queryKey: ['/api/users'],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Directory</h1>
          <p className="text-muted-foreground">Discover and connect with your classmates</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Directory</h1>
          <p className="text-muted-foreground">Discover and connect with your classmates</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Unable to load users</div>
        </div>
      </div>
    );
  }

  // Filter out current user and sort alphabetically
  const otherUsers = users
    .filter(user => user.id !== currentUser?.id)
    .sort((a, b) => a.email.localeCompare(b.email));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Directory</h1>
          <p className="text-muted-foreground">Discover and connect with your classmates</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <UsersIcon className="w-4 h-4" />
          {otherUsers.length} users
        </Badge>
      </div>

      {otherUsers.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <UsersIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No other users found</h3>
              <p className="text-muted-foreground">You're the only user in the system right now.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherUsers.map((user) => (
            <Card key={user.id} className="hover-elevate" data-testid={`user-card-${user.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="text-sm font-semibold">
                          {getUserInitials(user.email)}
                        </AvatarFallback>
                      </Avatar>
                      {user.isAdmin && (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1" data-testid={`admin-crown-${user.id}`}>
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg" data-testid={`user-name-${user.id}`}>
                          {getUsername(user.email)}
                        </CardTitle>
                        {user.isAdmin && (
                          <Badge variant="secondary" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground" data-testid={`user-email-${user.id}`}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium" data-testid={`user-balance-${user.id}`}>
                      {user.balance.toLocaleString()} Astras
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      data-testid={`button-add-friend-${user.id}`}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Friend
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}