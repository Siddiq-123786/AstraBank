import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, UserCheck, UserX, Send } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddFriendModal from "@/components/AddFriendModal";
import SendMoneyModal from "@/components/SendMoneyModal";

interface Friend {
  id: string;
  email: string;
  balance: number;
  friendshipStatus: string;
  requestedByCurrent: boolean;
}

export default function Friends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [sendMoneyModalOpen, setSendMoneyModalOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");

  // Fetch friends data
  const { data: friends = [], isLoading } = useQuery<Friend[]>({
    queryKey: ['/api/friends'],
  });

  // Fetch recommended users
  const { data: recommendedUsers = [] } = useQuery<Pick<Friend, 'id' | 'email' | 'balance'>[]>({
    queryKey: ['/api/friends/recommended'],
  });

  const acceptFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const res = await apiRequest('POST', `/api/friends/${friendId}/accept`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({
        title: "Friend request accepted!",
        description: "You can now send Astras to each other",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to accept friend request",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });

  const rejectFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const res = await apiRequest('POST', `/api/friends/${friendId}/reject`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({
        title: "Friend request rejected",
        description: "The friend request has been declined",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reject friend request",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest('POST', '/api/friends/add', { email });
      return res.json();
    },
    onSuccess: (_, email) => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/recommended'] });
      toast({
        title: "Friend request sent!",
        description: `Sent a friend request to ${email}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send friend request",
        description: error.message || "Could not send friend request",
        variant: "destructive",
      });
    }
  });

  const handleAcceptFriend = (friendId: string) => {
    acceptFriendMutation.mutate(friendId);
  };

  const handleRejectFriend = (friendId: string) => {
    rejectFriendMutation.mutate(friendId);
  };

  const handleSendMoney = (friendId: string) => {
    setSelectedFriendId(friendId);
    setSendMoneyModalOpen(true);
  };

  const handleSendFriendRequest = (email: string) => {
    sendFriendRequestMutation.mutate(email);
  };

  const getUserInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getUsername = (email: string) => {
    return email.split('@')[0].replace('.', ' ');
  };

  // Separate friends by status
  const acceptedFriends = friends.filter(f => f.friendshipStatus === 'accepted');
  const pendingOutgoing = friends.filter(f => f.friendshipStatus === 'pending' && f.requestedByCurrent);
  const pendingIncoming = friends.filter(f => f.friendshipStatus === 'pending' && !f.requestedByCurrent);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Friends
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your friendships and send Astras to your classmates
          </p>
        </div>
        <Button onClick={() => setAddFriendModalOpen(true)} data-testid="button-add-friend">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Friend
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                <UserCheck className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accepted Friends</p>
                <p className="text-2xl font-bold">{acceptedFriends.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <UserPlus className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{pendingIncoming.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <UserX className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sent Requests</p>
                <p className="text-2xl font-bold">{pendingOutgoing.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Classmates */}
      {recommendedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recommended Classmates
              <Badge variant="secondary">{recommendedUsers.length}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Connect with your classmates from Astra Nova
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedUsers.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`recommended-user-${user.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{getUserInitials(user.email)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{getUsername(user.email)}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.balance.toLocaleString()} ⭐
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleSendFriendRequest(user.email)}
                    disabled={sendFriendRequestMutation.isPending}
                    data-testid={`button-add-recommended-${user.id}`}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incoming Friend Requests */}
      {pendingIncoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Incoming Friend Requests
              <Badge variant="default">{pendingIncoming.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingIncoming.map((friend) => (
                <div 
                  key={friend.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`incoming-request-${friend.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{getUserInitials(friend.email)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{getUsername(friend.email)}</h4>
                      <p className="text-sm text-muted-foreground">{friend.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleAcceptFriend(friend.id)}
                      disabled={acceptFriendMutation.isPending}
                      data-testid={`button-accept-${friend.id}`}
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleRejectFriend(friend.id)}
                      disabled={rejectFriendMutation.isPending}
                      data-testid={`button-reject-${friend.id}`}
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accepted Friends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Your Friends
            {acceptedFriends.length > 0 && (
              <Badge variant="outline">{acceptedFriends.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {acceptedFriends.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No friends yet</h3>
              <p className="text-muted-foreground mb-4">
                Add some classmates to start sending and receiving Astras!
              </p>
              <Button onClick={() => setAddFriendModalOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Your First Friend
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acceptedFriends.map((friend) => (
                <div 
                  key={friend.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`friend-${friend.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{getUserInitials(friend.email)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{getUsername(friend.email)}</h4>
                      <p className="text-sm text-muted-foreground">{friend.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {friend.balance.toLocaleString()} ⭐
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleSendMoney(friend.id)}
                    data-testid={`button-send-${friend.id}`}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Send
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outgoing Friend Requests */}
      {pendingOutgoing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5" />
              Sent Friend Requests
              <Badge variant="outline">{pendingOutgoing.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingOutgoing.map((friend) => (
                <div 
                  key={friend.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`outgoing-request-${friend.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{getUserInitials(friend.email)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{getUsername(friend.email)}</h4>
                      <p className="text-sm text-muted-foreground">{friend.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <AddFriendModal 
        open={addFriendModalOpen} 
        onOpenChange={setAddFriendModalOpen} 
      />
      
      <SendMoneyModal
        open={sendMoneyModalOpen}
        onOpenChange={setSendMoneyModalOpen}
        selectedFriendId={selectedFriendId}
      />
    </div>
  );
}