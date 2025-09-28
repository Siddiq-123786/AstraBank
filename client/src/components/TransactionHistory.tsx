import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, TrendingUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ApiTransaction } from "@shared/schema";

interface TransactionHistoryProps {
  transactions: ApiTransaction[];
  isLoading?: boolean;
}

export default function TransactionHistory({ transactions, isLoading }: TransactionHistoryProps) {
  const { user } = useAuth();
  
  const getIcon = (transactionType: 'sent' | 'received') => {
    return <Send className="w-4 h-4" />;
  };

  const getAmountColor = (transactionType: 'sent' | 'received') => {
    return transactionType === 'received' ? 'text-green-600' : 'text-red-600';
  };

  const getAmountPrefix = (transactionType: 'sent' | 'received') => {
    return transactionType === 'received' ? '+' : '-';
  };

  const getUserInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getTransactionType = (transaction: ApiTransaction): 'sent' | 'received' => {
    if (!user) return 'received';
    return transaction.fromUserId === user.id ? 'sent' : 'received';
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No transactions yet. Send some Astras to get started!</p>
          </div>
        ) : (
          transactions.map((transaction) => {
            const transactionType = getTransactionType(transaction);
            const userInitials = getUserInitials(transaction.counterpartEmail);
            const formattedDate = format(new Date(transaction.createdAt), 'MMM d, h:mm a');
            
            return (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-3 rounded-lg hover-elevate bg-muted/20"
                data-testid={`transaction-${transaction.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    {getIcon(transactionType)}
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{formattedDate}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-mono font-medium", getAmountColor(transactionType))}>
                    {getAmountPrefix(transactionType)}{transaction.amount.toLocaleString()} ⭐
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {transactionType}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}