import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { UserPlus, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AddFriendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddFriendModal({ open, onOpenChange }: AddFriendModalProps) {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const addFriendMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest('POST', '/api/friends/add', { email });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({
        title: "Friend request sent!",
        description: `Sent a friend request to ${email}`,
      });
      setEmail('');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add friend",
        description: error.message || "Could not send friend request",
        variant: "destructive",
      });
    }
  });

  const handleAdd = () => {
    if (email.trim()) {
      addFriendMutation.mutate(email.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => onOpenChange(open)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Friend
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Gmail Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="friend@astranova.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-friend-email"
            />
            <p className="text-xs text-muted-foreground">
              Enter your classmate's Astra Nova Gmail address to send them a friend request
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleAdd} 
              disabled={!email.trim() || addFriendMutation.isPending}
              className="flex-1"
              data-testid="button-add-friend"
            >
              {addFriendMutation.isPending ? 'Sending...' : 'Add Friend'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}