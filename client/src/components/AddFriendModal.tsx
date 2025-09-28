import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { UserPlus, Mail } from "lucide-react";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (email: string) => void;
}

export default function AddFriendModal({ isOpen, onClose, onAdd }: AddFriendModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (email) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        onAdd(email);
        setEmail('');
        setIsLoading(false);
        onClose();
      }, 1000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleAdd} 
              disabled={!email || isLoading}
              className="flex-1"
              data-testid="button-add-friend"
            >
              {isLoading ? 'Adding...' : 'Add Friend'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}