import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Check, X, Clock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Friend {
  id: string;
  email: string;
  balance: number;
  friendshipStatus: string;
  requestedByCurrent: boolean;
}

interface FriendCardProps {
  friend: Friend;
  onSend: (friendId: string) => void;
}

export default function FriendCard({ friend, onSend }: FriendCardProps) {
  const { toast } = useToast();
  
  const acceptFriendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/friends/${friend.id}/accept`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({ title: "Friend request accepted!" });
    }
  });

  const rejectFriendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/friends/${friend.id}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({ title: "Friend request rejected" });
    }
  });

  const getInitials = (email: string) => {
    return email.split('@')[0].charAt(0).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline"><Check className="w-3 h-3 mr-1" />Friends</Badge>;
      case 'blocked':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Blocked</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{getInitials(friend.email)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium" data-testid={`text-friend-email-${friend.id}`}>
                  {friend.email}
                </h3>
                {getStatusBadge(friend.friendshipStatus)}
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                {friend.balance.toLocaleString()} ⭐
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {friend.friendshipStatus === 'pending' && !friend.requestedByCurrent && (
              // Only show Accept/Reject for incoming requests
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => acceptFriendMutation.mutate()}
                  disabled={acceptFriendMutation.isPending}
                  data-testid={`button-accept-${friend.id}`}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => rejectFriendMutation.mutate()}
                  disabled={rejectFriendMutation.isPending}
                  data-testid={`button-reject-${friend.id}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
            
            {friend.friendshipStatus === 'accepted' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSend(friend.id)}
                data-testid={`button-send-to-${friend.id}`}
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}