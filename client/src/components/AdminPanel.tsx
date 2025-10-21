import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Shield, DollarSign, Ban, UserX, Plus, Minus, Users } from "lucide-react";

export default function AdminPanel() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentDescription, setAdjustmentDescription] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkDescription, setBulkDescription] = useState('');
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/users');
      return res.json();
    }
  });

  const updateBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount, description }: { userId: string; amount: number; description: string }) => {
      await apiRequest('POST', `/api/admin/users/${userId}/balance`, { amount, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Balance adjusted successfully" });
      setSelectedUser(null);
      setAdjustmentAmount('');
      setAdjustmentDescription('');
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to adjust balance", 
        description: error.message || "An error occurred",
        variant: "destructive"
      });
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

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ emails, amount, description }: { emails: string[]; amount: number; description: string }) => {
      const res = await apiRequest('POST', '/api/admin/bulk-balance', { emails, amount, description });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      const message = `Successfully updated ${data.success} users${data.failed > 0 ? `, ${data.failed} failed` : ''}`;
      toast({ 
        title: "Bulk update complete",
        description: message
      });
      if (data.errors.length > 0) {
        console.error('Bulk update errors:', data.errors);
      }
      setBulkDialogOpen(false);
      setBulkEmails('');
      setBulkAmount('');
      setBulkDescription('');
    },
    onError: (error: any) => {
      toast({ 
        title: "Bulk update failed", 
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  });

  const handleUpdateBalance = () => {
    if (selectedUser && adjustmentAmount && adjustmentDescription.trim()) {
      const amount = parseInt(adjustmentAmount);
      if (isNaN(amount)) {
        toast({ title: "Invalid amount", description: "Please enter a valid number", variant: "destructive" });
        return;
      }
      updateBalanceMutation.mutate({
        userId: selectedUser.id,
        amount: amount,
        description: adjustmentDescription.trim()
      });
    }
  };

  const handleBulkUpdate = () => {
    if (bulkEmails.trim() && bulkAmount && bulkDescription.trim()) {
      const amount = parseInt(bulkAmount);
      if (isNaN(amount)) {
        toast({ title: "Invalid amount", description: "Please enter a valid number", variant: "destructive" });
        return;
      }
      
      // Parse emails - split by commas, semicolons, or newlines
      const emailList = bulkEmails
        .split(/[,;\n]/)
        .map(e => e.trim())
        .filter(e => e.length > 0);
      
      if (emailList.length === 0) {
        toast({ title: "No emails provided", description: "Please enter at least one email address", variant: "destructive" });
        return;
      }
      
      bulkUpdateMutation.mutate({
        emails: emailList,
        amount: amount,
        description: bulkDescription.trim()
      });
    }
  };

  if (isLoading) return <div>Loading users...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Admin Panel
              </CardTitle>
              <CardDescription>
                Manage users, balances, and permissions
              </CardDescription>
            </div>
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="default"
                  data-testid="button-bulk-distribute"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Bulk Distribute Astras
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Bulk Distribute Astras</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-emails">User Emails</Label>
                    <Textarea
                      id="bulk-emails"
                      value={bulkEmails}
                      onChange={(e) => setBulkEmails(e.target.value)}
                      placeholder="Enter email addresses (one per line or comma/semicolon separated)"
                      rows={6}
                      data-testid="input-bulk-emails"
                    />
                    <p className="text-sm text-muted-foreground">
                      You can enter multiple emails separated by commas, semicolons, or new lines
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bulk-amount">Amount (Astras)</Label>
                    <Input
                      id="bulk-amount"
                      type="number"
                      value={bulkAmount}
                      onChange={(e) => setBulkAmount(e.target.value)}
                      placeholder="Enter amount (+ to add, - to subtract)"
                      className="font-mono"
                      data-testid="input-bulk-amount"
                    />
                    <p className="text-sm text-muted-foreground">
                      Use positive numbers to add Astras, negative to subtract
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bulk-description">Reason for Distribution</Label>
                    <Textarea
                      id="bulk-description"
                      value={bulkDescription}
                      onChange={(e) => setBulkDescription(e.target.value)}
                      placeholder="Explain why you're distributing Astras to these users..."
                      rows={3}
                      data-testid="input-bulk-description"
                    />
                  </div>

                  <Button 
                    onClick={handleBulkUpdate}
                    disabled={bulkUpdateMutation.isPending || !bulkEmails.trim() || !bulkAmount || !bulkDescription.trim()}
                    data-testid="button-submit-bulk-update"
                    className="w-full"
                  >
                    {bulkUpdateMutation.isPending ? "Processing..." : "Distribute to All"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
                        setAdjustmentAmount('');
                        setAdjustmentDescription('');
                      }}
                      data-testid={`button-edit-balance-${user.id}`}
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Adjust Balance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adjust Balance for {selectedUser?.email}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Current Balance</Label>
                        <div className="font-mono text-lg font-semibold">
                          {selectedUser?.balance.toLocaleString()} ⭐ Astras
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="adjustment-amount">Adjustment Amount</Label>
                        <Input
                          id="adjustment-amount"
                          type="number"
                          value={adjustmentAmount}
                          onChange={(e) => setAdjustmentAmount(e.target.value)}
                          placeholder="Enter amount (+ or -)"
                          className="font-mono"
                          data-testid="input-adjustment-amount"
                        />
                        <p className="text-sm text-muted-foreground">
                          Use positive numbers to add Astras, negative to subtract
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="adjustment-description">Reason for Adjustment</Label>
                        <Textarea
                          id="adjustment-description"
                          value={adjustmentDescription}
                          onChange={(e) => setAdjustmentDescription(e.target.value)}
                          placeholder="Explain why you're adjusting this user's balance..."
                          data-testid="input-adjustment-description"
                        />
                      </div>

                      <Button 
                        onClick={handleUpdateBalance}
                        disabled={updateBalanceMutation.isPending || !adjustmentAmount || !adjustmentDescription.trim()}
                        data-testid="button-update-balance"
                        className="w-full"
                      >
                        {updateBalanceMutation.isPending ? "Adjusting..." : "Adjust Balance"}
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