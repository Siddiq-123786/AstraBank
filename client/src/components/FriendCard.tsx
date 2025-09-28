import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";

interface Friend {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  lastActive: string;
}

interface FriendCardProps {
  friend: Friend;
  onSend: (friendId: string) => void;
}

export default function FriendCard({ friend, onSend }: FriendCardProps) {
  return (
    <Card className="w-full hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={friend.avatar} />
              <AvatarFallback>{friend.initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium" data-testid={`text-friend-name-${friend.id}`}>
                {friend.name}
              </h3>
              <p className="text-sm text-muted-foreground">{friend.email}</p>
              <p className="text-xs text-muted-foreground">Active {friend.lastActive}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSend(friend.id)}
            data-testid={`button-send-to-${friend.id}`}
          >
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}