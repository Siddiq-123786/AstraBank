import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

interface Friend {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
}

interface SendAstraModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFriend?: Friend;
  onSend: (friendId: string, amount: number, message: string) => void;
}

export default function SendAstraModal({ isOpen, onClose, selectedFriend, onSend }: SendAstraModalProps) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (selectedFriend && amount) {
      onSend(selectedFriend.id, parseInt(amount), message);
      setAmount('');
      setMessage('');
      onClose();
    }
  };

  if (!selectedFriend) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Astras</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
            <Avatar>
              <AvatarImage src={selectedFriend.avatar} />
              <AvatarFallback>{selectedFriend.initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{selectedFriend.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedFriend.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (⭐ Astras)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono"
              data-testid="input-send-amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a note..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              data-testid="input-send-message"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={!amount}
              className="flex-1"
              data-testid="button-confirm-send"
            >
              Send {amount} ⭐
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}