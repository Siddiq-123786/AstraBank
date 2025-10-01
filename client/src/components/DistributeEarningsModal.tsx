import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DistributeEarningsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
}

export default function DistributeEarningsModal({ 
  open, 
  onOpenChange, 
  companyId, 
  companyName 
}: DistributeEarningsModalProps) {
  const [amount, setAmount] = useState('');
  const { toast } = useToast();

  const distributeEarningsMutation = useMutation({
    mutationFn: async (data: { companyId: string; grossAmount: number }) => {
      const res = await apiRequest('POST', `/api/companies/${data.companyId}/distribute-earnings`, {
        companyId: data.companyId,
        grossAmount: data.grossAmount
      });
      return res.json();
    },
    onSuccess: (data: { adminFee: number; totalPaidOut: number; payoutCount: number }) => {
      toast({
        title: "Earnings distributed!",
        description: `Distributed ${data.totalPaidOut.toLocaleString()} Astras to ${data.payoutCount} equity holder${data.payoutCount > 1 ? 's' : ''}. Admin fee: ${data.adminFee.toLocaleString()} Astras.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      setAmount('');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to distribute earnings",
        description: error.message || "There was an error distributing earnings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDistribute = () => {
    const amountNum = parseInt(amount);
    
    if (!amount || isNaN(amountNum)) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid earnings amount",
        variant: "destructive",
      });
      return;
    }
    
    if (amountNum < 100) {
      toast({
        title: "Amount too small",
        description: "Minimum distribution is 100 Astras",
        variant: "destructive",
      });
      return;
    }
    
    if (amountNum > 1000000) {
      toast({
        title: "Amount too large",
        description: "Maximum distribution is 1,000,000 Astras",
        variant: "destructive",
      });
      return;
    }
    
    distributeEarningsMutation.mutate({
      companyId,
      grossAmount: amountNum
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Distribute Earnings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">Company</p>
            <p className="font-medium">{companyName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="earnings-amount">Earnings Amount (⭐ Astras)</Label>
            <Input
              id="earnings-amount"
              type="number"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono"
              min="100"
              max="1000000"
              step="1"
              data-testid="input-earnings-amount"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum: 100 Astras</span>
              <span>Maximum: 1,000,000 Astras</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Each admin receives 1.5% (total admin fee: 4.5% with 3 admins)
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
              data-testid="button-cancel-earnings"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDistribute}
              disabled={!amount || parseInt(amount) < 100 || distributeEarningsMutation.isPending}
              className="flex-1"
              data-testid="button-distribute-earnings"
            >
              {distributeEarningsMutation.isPending ? 'Distributing...' : 'Distribute'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
