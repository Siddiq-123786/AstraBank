import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type EquityHolding = {
  id: string;
  companyId: string;
  userId: string;
  basisPoints: number;
  canReceivePayouts: boolean;
  createdAt: Date;
  companyName: string;
  totalInvested: number;
};

type Payout = {
  id: string;
  earningsId: string;
  companyId: string;
  userId: string;
  amount: number;
  payoutType: string;
  createdAt: Date;
  companyName: string;
  earningsDate: Date;
};

export default function Investments() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: equity = [], isLoading: isLoadingEquity, error: equityError } = useQuery<EquityHolding[]>({
    queryKey: [`/api/users/${user?.id}/equity`],
    enabled: !!user?.id,
  });

  const { data: payouts = [], isLoading: isLoadingPayouts, error: payoutsError } = useQuery<Payout[]>({
    queryKey: [`/api/users/${user?.id}/payouts`],
    enabled: !!user?.id,
  });

  // Show error toasts if queries fail
  useEffect(() => {
    if (equityError) {
      toast({
        variant: "destructive",
        title: "Failed to load equity holdings",
        description: "Please try refreshing the page",
      });
    }
  }, [equityError, toast]);

  useEffect(() => {
    if (payoutsError) {
      toast({
        variant: "destructive",
        title: "Failed to load earnings history",
        description: "Please try refreshing the page",
      });
    }
  }, [payoutsError, toast]);

  const totalEquityValue = equity.reduce((sum, holding) => {
    return sum + (holding.basisPoints / 100);
  }, 0);

  const totalEarnings = payouts.reduce((sum, payout) => sum + payout.amount, 0);

  // Calculate total invested from equity holdings
  const totalInvested = equity.reduce((sum, holding) => sum + holding.totalInvested, 0);

  // Calculate earnings per company
  const earningsByCompany = payouts.reduce((acc: Record<string, number>, payout) => {
    acc[payout.companyId] = (acc[payout.companyId] || 0) + payout.amount;
    return acc;
  }, {} as Record<string, number>);

  // Calculate ROI for a specific company
  const getCompanyROI = (companyId: string, invested: number) => {
    const earned = earningsByCompany[companyId] || 0;
    if (invested === 0) return 0;
    return ((earned / invested) * 100);
  };

  const formatPercentage = (bps: number) => {
    return `${(bps / 100).toFixed(2)}%`;
  };

  if (isLoadingEquity || isLoadingPayouts) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Investment Portfolio</h1>
          <p className="text-muted-foreground">Track your company investments and earnings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Investment Portfolio</h1>
        <p className="text-muted-foreground">Track your company investments and earnings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Holdings</p>
                <p className="text-2xl font-bold" data-testid="stat-holdings-count">{equity.length}</p>
              </div>
              <Building className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Invested</p>
                <p className="text-2xl font-bold" data-testid="stat-total-invested">⭐ {totalInvested.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                <p className="text-2xl font-bold" data-testid="stat-total-earnings">⭐ {totalEarnings.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Overall ROI</p>
                <p className={`text-2xl font-bold ${totalInvested > 0 && totalEarnings > totalInvested ? 'text-green-500' : ''}`} data-testid="stat-overall-roi">
                  {totalInvested > 0 ? ((totalEarnings / totalInvested) * 100).toFixed(1) : '0'}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equity Holdings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Your Equity Holdings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {equity.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No equity holdings yet</p>
              <p className="text-sm text-muted-foreground">
                Invest in companies to start building your portfolio
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {equity.map((holding) => {
                const invested = holding.totalInvested;
                const earned = earningsByCompany[holding.companyId] || 0;
                const roi = getCompanyROI(holding.companyId, invested);
                
                return (
                  <div
                    key={holding.id}
                    className="p-4 rounded-lg border space-y-3"
                    data-testid={`equity-${holding.companyId}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1" data-testid={`equity-company-name-${holding.companyId}`}>
                          {holding.companyName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Invested: {new Date(holding.createdAt).toLocaleDateString()}</span>
                          {!holding.canReceivePayouts && (
                            <Badge variant="secondary" data-testid={`equity-status-${holding.companyId}`}>
                              Non-Payout
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary" data-testid={`equity-percentage-${holding.companyId}`}>
                          {formatPercentage(holding.basisPoints)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {holding.basisPoints.toLocaleString()} bps
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Invested</p>
                        <p className="font-semibold" data-testid={`equity-invested-${holding.companyId}`}>
                          ⭐ {invested.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Earned</p>
                        <p className="font-semibold text-green-600" data-testid={`equity-earned-${holding.companyId}`}>
                          ⭐ {earned.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">ROI</p>
                        <p className={`font-semibold ${roi > 0 ? 'text-green-600' : ''}`} data-testid={`equity-roi-${holding.companyId}`}>
                          {roi.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Earnings History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No earnings yet</p>
              <p className="text-sm text-muted-foreground">
                You'll see your earnings here when companies distribute profits
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                  data-testid={`payout-${payout.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold" data-testid={`payout-company-${payout.id}`}>
                        {payout.companyName}
                      </h3>
                      <Badge 
                        variant={payout.payoutType === 'admin_fee' ? 'default' : 'secondary'}
                        data-testid={`payout-type-${payout.id}`}
                      >
                        {payout.payoutType === 'admin_fee' ? 'Admin Fee' : 'Equity Payout'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(payout.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400" data-testid={`payout-amount-${payout.id}`}>
                      +⭐ {payout.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
