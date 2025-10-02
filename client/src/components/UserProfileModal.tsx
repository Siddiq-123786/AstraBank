import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Star, 
  Users, 
  Clock, 
  TrendingUp, 
  Building, 
  Crown,
  UserPlus,
  UserCheck,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

type UserProfile = {
  id: string;
  email: string;
  balance: number;
  isAdmin: boolean;
  createdAt: string;
  friendshipStatus: string | null;
  requestedByCurrent: boolean;
  friends: Array<{ id: string; email: string }>;
  pendingRequests: Array<{ id: string; email: string }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    type: string;
    description: string;
    createdAt: string;
    fromUserId: string;
    toUserId: string;
  }>;
  investments: Array<{
    companyId: string;
    companyName: string;
    basisPoints: number;
  }>;
  createdCompanies: Array<{
    id: string;
    name: string;
    category: string;
    currentFunding: number;
    fundingGoal: number;
  }>;
};

function getUserInitials(email: string): string {
  const username = email.split('@')[0];
  return username.slice(0, 2).toUpperCase();
}

function getUsername(email: string): string {
  return email.split('@')[0];
}

export default function UserProfileModal({ open, onOpenChange, userId }: UserProfileModalProps) {
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['/api/users', userId, 'profile'],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/profile`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: !!userId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]" data-testid="user-profile-modal">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading profile...</div>
          </div>
        ) : !profile ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Profile not found</div>
          </div>
        ) : (
          <ScrollArea className="max-h-[calc(90vh-80px)]">
            <DialogHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-xl font-semibold">
                      {getUserInitials(profile.email)}
                    </AvatarFallback>
                  </Avatar>
                  {profile.isAdmin && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1.5">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl" data-testid="profile-username">
                    {getUsername(profile.email)}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground" data-testid="profile-email">
                    {profile.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {profile.isAdmin && (
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    )}
                    {profile.friendshipStatus === 'accepted' && (
                      <Badge variant="default" className="text-xs">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Friends
                      </Badge>
                    )}
                    {profile.friendshipStatus === 'pending' && (
                      <Badge variant="secondary" className="text-xs">
                        <UserPlus className="w-3 h-3 mr-1" />
                        {profile.requestedByCurrent ? 'Request Sent' : 'Pending Request'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {/* Balance & Join Date */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">Balance</span>
                    </div>
                    <p className="text-2xl font-bold" data-testid="profile-balance">
                      {profile.balance.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Astras</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Joined</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {new Date(profile.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Friends Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Friends ({profile.friends.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.friends.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No friends yet</p>
                  ) : (
                    <div className="space-y-2">
                      {profile.friends.slice(0, 5).map((friend) => (
                        <div key={friend.id} className="flex items-center justify-between py-1">
                          <span className="text-sm">{getUsername(friend.email)}</span>
                          <span className="text-xs text-muted-foreground">{friend.email}</span>
                        </div>
                      ))}
                      {profile.friends.length > 5 && (
                        <p className="text-xs text-muted-foreground pt-2">
                          +{profile.friends.length - 5} more
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Requests */}
              {profile.pendingRequests.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Pending Friend Requests ({profile.pendingRequests.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {profile.pendingRequests.slice(0, 3).map((request) => (
                        <div key={request.id} className="flex items-center justify-between py-1">
                          <span className="text-sm">{getUsername(request.email)}</span>
                          <span className="text-xs text-muted-foreground">{request.email}</span>
                        </div>
                      ))}
                      {profile.pendingRequests.length > 3 && (
                        <p className="text-xs text-muted-foreground pt-2">
                          +{profile.pendingRequests.length - 3} more
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Investments */}
              {profile.investments.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Investments ({profile.investments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {profile.investments.map((investment) => (
                        <div key={investment.companyId} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className="text-sm font-medium">{investment.companyName}</span>
                          <Badge variant="outline">{(investment.basisPoints / 100).toFixed(2)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Created Companies */}
              {profile.createdCompanies.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Created Companies ({profile.createdCompanies.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {profile.createdCompanies.map((company) => (
                        <div key={company.id} className="space-y-1 py-2 border-b last:border-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{company.name}</span>
                            <Badge variant="outline" className="text-xs">{company.category}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Funding: {company.currentFunding.toLocaleString()} / {company.fundingGoal.toLocaleString()}</span>
                            <span>{Math.round((company.currentFunding / company.fundingGoal) * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Transactions */}
              {profile.recentTransactions.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Recent Activity ({profile.recentTransactions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {profile.recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {tx.fromUserId === profile.id ? (
                                <ArrowRight className="w-3 h-3 text-destructive" />
                              ) : (
                                <ArrowLeft className="w-3 h-3 text-green-500" />
                              )}
                              <span className="text-sm">{tx.description}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(tx.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span className={`text-sm font-medium ${tx.fromUserId === profile.id ? 'text-destructive' : 'text-green-500'}`}>
                            {tx.fromUserId === profile.id ? '-' : '+'}{tx.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
