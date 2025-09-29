import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Send, TrendingUp, Plus, ArrowRight, ArrowLeft, Calendar, MessageSquare } from "lucide-react";
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
  const [selectedTransaction, setSelectedTransaction] = useState<ApiTransaction | null>(null);
  
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
                className="flex items-center justify-between p-3 rounded-lg hover-elevate bg-muted/20 cursor-pointer transition-all"
                onClick={() => setSelectedTransaction(transaction)}
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
      
      {/* Transaction Details Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="sm:max-w-2xl w-[90vw] h-[85vh] flex flex-col">
          {selectedTransaction && (
            <>
              <DialogHeader className="flex-shrink-0 pb-4">
                <DialogTitle className="flex items-center gap-2">
                  Transaction Details
                  <Badge variant="outline" className="ml-auto">
                    {getTransactionType(selectedTransaction)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                {/* Transaction Summary - Compact */}
                <div className="flex-shrink-0 flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      {getTransactionType(selectedTransaction) === 'received' ? (
                        <ArrowLeft className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">
                        {getTransactionType(selectedTransaction) === 'received' ? 'Received from' : 'Sent to'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedTransaction.counterpartEmail}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-lg font-mono font-bold", getAmountColor(getTransactionType(selectedTransaction)))}>
                      {getAmountPrefix(getTransactionType(selectedTransaction))}{selectedTransaction.amount.toLocaleString()} ⭐
                    </p>
                  </div>
                </div>

                {/* Large Description Area - Takes up most space */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Description</span>
                  </div>
                  <div className="flex-1 bg-muted/20 p-4 rounded-md overflow-y-auto min-h-0">
                    <p className="text-base break-words whitespace-pre-wrap leading-relaxed">{selectedTransaction.description}</p>
                  </div>
                </div>

                {/* Compact Footer Info */}
                <div className="flex-shrink-0 grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Date</span>
                    </div>
                    <p className="text-xs">
                      {format(new Date(selectedTransaction.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Transaction ID</span>
                    <p className="text-xs font-mono break-all">{selectedTransaction.id.slice(0, 16)}...</p>
                  </div>
                </div>

                <div className="flex justify-end flex-shrink-0 pt-2">
                  <Button onClick={() => setSelectedTransaction(null)} variant="outline" size="sm">
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}