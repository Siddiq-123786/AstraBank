import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Shield, DollarSign, Ban, UserX } from "lucide-react";

export default function AdminPanel() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newBalance, setNewBalance] = useState('');

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/users');
      return res.json();
    }
  });

  const updateBalanceMutation = useMutation({
    mutationFn: async ({ userId, balance }: { userId: string; balance: number }) => {
      await apiRequest('POST', `/api/admin/users/${userId}/balance`, { balance });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Balance updated successfully" });
      setSelectedUser(null);
      setNewBalance('');
    }
  });

  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('POST', `/api/admin/users/${userId}/ban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "User banned successfully" });
    }
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('POST', `/api/admin/users/${userId}/unban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "User unbanned successfully" });
    }
  });

  const makeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('POST', `/api/admin/users/${userId}/make-admin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Admin rights granted successfully" });
    }
  });

  const removeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('POST', `/api/admin/users/${userId}/remove-admin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Admin rights removed successfully" });
    }
  });

  const handleUpdateBalance = () => {
    if (selectedUser && newBalance) {
      updateBalanceMutation.mutate({
        userId: selectedUser.id,
        balance: parseInt(newBalance)
      });
    }
  };

  if (isLoading) return <div>Loading users...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin Panel
          </CardTitle>
          <CardDescription>
            Manage users, balances, and permissions
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {users?.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium" data-testid={`text-user-email-${user.id}`}>
                    {user.email}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {user.balance.toLocaleString()} ⭐
                    </span>
                    {user.isFounder && (
                      <Badge variant="default" className="bg-accent text-accent-foreground">Founder</Badge>
                    )}
                    {user.isAdmin && (
                      <Badge variant="secondary">Admin</Badge>
                    )}
                    {user.isBanned && (
                      <Badge variant="destructive">Banned</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(user);
                        setNewBalance(user.balance.toString());
                      }}
                      data-testid={`button-edit-balance-${user.id}`}
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Edit Balance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Balance for {selectedUser?.email}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-balance">New Balance (⭐ Astras)</Label>
                        <Input
                          id="new-balance"
                          type="number"
                          value={newBalance}
                          onChange={(e) => setNewBalance(e.target.value)}
                          className="font-mono"
                          data-testid="input-new-balance"
                        />
                      </div>
                      <Button 
                        onClick={handleUpdateBalance}
                        disabled={updateBalanceMutation.isPending}
                        data-testid="button-update-balance"
                      >
                        Update Balance
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {user.isBanned ? (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => unbanUserMutation.mutate(user.id)}
                    disabled={unbanUserMutation.isPending}
                    data-testid={`button-unban-${user.id}`}
                  >
                    Unban
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => banUserMutation.mutate(user.id)}
                    disabled={banUserMutation.isPending}
                    data-testid={`button-ban-${user.id}`}
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    Ban
                  </Button>
                )}

                {user.isAdmin ? (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => removeAdminMutation.mutate(user.id)}
                    disabled={removeAdminMutation.isPending}
                    data-testid={`button-remove-admin-${user.id}`}
                  >
                    <UserX className="w-4 h-4 mr-1" />
                    Remove Admin
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => makeAdminMutation.mutate(user.id)}
                    disabled={makeAdminMutation.isPending}
                    data-testid={`button-make-admin-${user.id}`}
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Make Admin
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}