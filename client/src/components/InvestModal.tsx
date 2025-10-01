import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp } from "lucide-react";

interface InvestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    id: string;
    name: string;
    fundingGoal: number;
    currentFunding: number;
  } | null;
}

export default function InvestModal({ open, onOpenChange, company }: InvestModalProps) {
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const investMutation = useMutation({
    mutationFn: async (data: { companyId: string; amount: number }) => {
      const res = await apiRequest('POST', `/api/companies/${data.companyId}/invest`, {
        amount: data.amount
      });
      return res.json();
    },
    onSuccess: (data: { message: string; basisPointsReceived: number }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/investments'] });
      
      const equityPercent = (data.basisPointsReceived / 100).toFixed(2);
      toast({
        title: "Investment successful!",
        description: `You invested ${amount} Astras and received ${equityPercent}% equity.`,
      });
      
      setAmount("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Investment failed",
        description: error.message || "Unable to process investment",
        variant: "destructive",
      });
    }
  });

  const handleInvest = () => {
    if (!company) return;
    
    const investAmount = parseInt(amount);
    
    if (!amount || isNaN(investAmount)) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid investment amount",
        variant: "destructive",
      });
      return;
    }

    if (investAmount < 100) {
      toast({
        title: "Investment too small",
        description: "Minimum investment is 100 Astras",
        variant: "destructive",
      });
      return;
    }

    if (investAmount > 50000) {
      toast({
        title: "Investment too large",
        description: "Maximum investment is 50,000 Astras",
        variant: "destructive",
      });
      return;
    }

    investMutation.mutate({
      companyId: company.id,
      amount: investAmount
    });
  };

  const remainingFunding = company ? company.fundingGoal - company.currentFunding : 0;
  const maxInvestment = Math.min(remainingFunding, 50000);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="invest-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Invest in {company?.name}
          </DialogTitle>
          <DialogDescription>
            Enter the amount of Astras you want to invest. You'll receive equity proportional to your investment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invest-amount">Investment Amount (Astras)</Label>
            <Input
              id="invest-amount"
              type="number"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              max={maxInvestment.toString()}
              step="1"
              className="font-mono"
              data-testid="input-invest-amount"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum: 100 Astras</span>
              <span>Maximum: {maxInvestment.toLocaleString()} Astras</span>
            </div>
          </div>

          {company && (
            <div className="space-y-2 p-3 bg-muted rounded-md">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Funding:</span>
                <span className="font-medium">{company.currentFunding.toLocaleString()} Astras</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Funding Goal:</span>
                <span className="font-medium">{company.fundingGoal.toLocaleString()} Astras</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium">{remainingFunding.toLocaleString()} Astras</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={investMutation.isPending}
            data-testid="button-cancel-invest"
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvest}
            disabled={investMutation.isPending}
            data-testid="button-confirm-invest"
          >
            {investMutation.isPending ? "Processing..." : "Invest"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
