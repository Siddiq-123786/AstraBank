import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InvestmentRequest, Company } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface InvestmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
}

export default function InvestmentModal({ open, onOpenChange, company }: InvestmentModalProps) {
  const [amount, setAmount] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const investMutation = useMutation({
    mutationFn: (data: InvestmentRequest) => 
      apiRequest('POST', `/api/companies/${data.companyId}/invest`, { amount: data.amount }),
    onSuccess: () => {
      toast({
        title: "Investment successful!",
        description: `You've invested ${amount} Astras in ${company?.name}. Great choice!`,
      });
      
      // Invalidate relevant data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      // Reset form
      setAmount('');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Investment failed",
        description: error.message || "There was an error processing your investment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInvest = () => {
    if (company && amount && parseInt(amount) > 0) {
      investMutation.mutate({
        companyId: company.id,
        amount: parseInt(amount),
      });
    }
  };

  if (!company || !user) return null;

  const fundingProgress = (company.currentFunding / company.fundingGoal) * 100;
  const remainingFunding = company.fundingGoal - company.currentFunding;
  const maxInvestment = Math.min(user.balance, remainingFunding, 50000);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Invest in {company.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="p-4 bg-muted rounded-md">
              <h3 className="font-medium text-sm">{company.name}</h3>
              <p className="text-sm text-muted-foreground">{company.description}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                <span>{fundingProgress.toFixed(1)}% funded</span> • 
                <span className="ml-1">{company.currentFunding.toLocaleString()} / {company.fundingGoal.toLocaleString()} ⭐</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="investment-amount">Investment Amount (⭐ Astras)</Label>
            <Input
              id="investment-amount"
              type="number"
              placeholder="1000"
              min="100"
              max={maxInvestment}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              data-testid="input-investment-amount"
            />
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Your balance:</span>
                <span className="font-mono">{user.balance.toLocaleString()} ⭐</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining to goal:</span>
                <span className="font-mono">{remainingFunding.toLocaleString()} ⭐</span>
              </div>
              <div className="text-center pt-1 border-t">
                <span>Maximum investment: {maxInvestment.toLocaleString()} ⭐</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
              data-testid="button-cancel-investment"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleInvest}
              disabled={investMutation.isPending || !amount || parseInt(amount) < 100 || parseInt(amount) > maxInvestment}
              className="flex-1"
              data-testid="button-confirm-investment"
            >
              {investMutation.isPending ? "Investing..." : `Invest ${amount || "0"} ⭐`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}