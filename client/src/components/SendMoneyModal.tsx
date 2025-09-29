import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Send, Loader2 } from "lucide-react";

const sendMoneySchema = z.object({
  amount: z.number().int().positive().max(100000, "Maximum 100,000 Astras per transaction"),
  description: z.string().min(1, "Description is required").max(350, "Description must be 350 characters or less"),
});

type SendMoneyForm = z.infer<typeof sendMoneySchema>;

interface Friend {
  id: string;
  email: string;
  balance: number;
  friendshipStatus: string;
  requestedByCurrent: boolean;
}

interface SendMoneyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFriendId?: string;
}

export default function SendMoneyModal({ open, onOpenChange, selectedFriendId }: SendMoneyModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFriend, setSelectedFriend] = useState<string>("");

  const form = useForm<SendMoneyForm>({
    resolver: zodResolver(sendMoneySchema),
    defaultValues: {
      amount: 0,
      description: "",
    },
  });

  // Sync selected friend with prop and reset on modal open/close
  useEffect(() => {
    if (open) {
      setSelectedFriend(selectedFriendId || "");
    } else {
      setSelectedFriend("");
      form.reset();
    }
  }, [selectedFriendId, open, form]);

  // Fetch accepted friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery<Friend[]>({
    queryKey: ['/api/friends'],
    select: (data) => data.filter(friend => friend.friendshipStatus === 'accepted')
  });

  const sendMoneyMutation = useMutation({
    mutationFn: async (data: SendMoneyForm) => {
      if (!selectedFriend) {
        throw new Error("Please select a friend to send money to");
      }
      
      return await apiRequest('POST', '/api/send-money', {
        toUserId: selectedFriend,
        amount: data.amount,
        description: data.description,
      });
    },
    onSuccess: () => {
      toast({
        title: "Money sent!",
        description: "Your Astras have been sent successfully.",
      });
      
      // Invalidate user data to update balance
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      form.reset();
      setSelectedFriend("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to send money",
        description: error.message || "Something went wrong. Please try again.",
      });
    }
  });

  const selectedFriendData = friends.find(friend => friend.id === selectedFriend);

  const onSubmit = (data: SendMoneyForm) => {
    sendMoneyMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-send-money">
        <DialogHeader>
          <DialogTitle>Send Astras</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Friend Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Send to:</label>
            {friendsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading friends...</span>
              </div>
            ) : friends.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No friends available. Add friends first to send money.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                      selectedFriend === friend.id
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'hover:bg-muted border-2 border-transparent'
                    }`}
                    onClick={() => setSelectedFriend(friend.id)}
                    data-testid={`button-select-friend-${friend.id}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{friend.email.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{friend.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Balance: {friend.balance.toLocaleString()} ⭐
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Amount and Description Form */}
          {selectedFriendData && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Sending to:</span>
                  <span className="font-medium">{selectedFriendData.email}</span>
                </div>

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (Astras)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            className="pr-8"
                            data-testid="input-amount"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                            ⭐
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Your balance: {user?.balance.toLocaleString()} ⭐
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What's this for?"
                          className="resize-none"
                          rows={3}
                          {...field}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={sendMoneyMutation.isPending}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={sendMoneyMutation.isPending}
                    data-testid="button-send-money"
                  >
                    {sendMoneyMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Astras
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}