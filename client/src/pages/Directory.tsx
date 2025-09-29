import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users as UsersIcon, Crown, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type UserProfile = {
  id: string;
  email: string;
  balance: number;
  isAdmin: boolean;
  createdAt: string;
};

export default function Directory() {
  const { user: currentUser } = useAuth();
  
  const { data: users = [], isLoading, error } = useQuery<UserProfile[]>({
    queryKey: ['/api/users'],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Student Directory</h1>
          <p className="text-muted-foreground">Complete list of all registered students</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading directory...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Student Directory</h1>
          <p className="text-muted-foreground">Complete list of all registered students</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Unable to load directory</div>
        </div>
      </div>
    );
  }

  // Sort all users alphabetically by email
  const sortedUsers = [...users].sort((a, b) => a.email.localeCompare(b.email));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Directory</h1>
          <p className="text-muted-foreground">Complete list of all registered students</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <UsersIcon className="w-4 h-4" />
          {sortedUsers.length} students
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            All Student Emails
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedUsers.map((user) => (
              <div 
                key={user.id} 
                className={`flex items-center gap-2 p-3 rounded-md border ${
                  user.id === currentUser?.id ? 'bg-accent border-accent-border' : 'hover-elevate'
                }`}
                data-testid={`directory-item-${user.id}`}
              >
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium truncate" data-testid={`directory-email-${user.id}`}>
                  {user.email}
                </span>
                {user.isAdmin && (
                  <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" data-testid={`directory-crown-${user.id}`} />
                )}
                {user.id === currentUser?.id && (
                  <Badge variant="outline" className="text-xs ml-auto flex-shrink-0">
                    You
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
