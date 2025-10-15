import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowUpDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ApiTransaction } from "@shared/schema";

export default function History() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Fetch transactions data
  const { data: transactions = [], isLoading } = useQuery<ApiTransaction[]>({
    queryKey: ['/api/transactions'],
  });

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

  const getAmountColor = (transactionType: 'sent' | 'received') => {
    return transactionType === 'received' ? 'text-green-600' : 'text-red-600';
  };

  const getAmountPrefix = (transactionType: 'sent' | 'received') => {
    return transactionType === 'received' ? '+' : '-';
  };

  const getTransactionTitle = (transaction: ApiTransaction, transactionType: 'sent' | 'received') => {
    // For admins viewing all transactions, show from/to format
    if (user?.isAdmin && 'fromUserEmail' in transaction && 'toUserEmail' in transaction) {
      const fromUsername = (transaction as any).fromUserEmail.split('@')[0].replace('.', ' ');
      const toUsername = (transaction as any).toUserEmail.split('@')[0].replace('.', ' ');
      return `${fromUsername} → ${toUsername}`;
    }
    
    const username = transaction.counterpartEmail.split('@')[0].replace('.', ' ');
    return transactionType === 'sent' 
      ? `Sent to ${username}` 
      : `Received from ${username}`;
  };

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      if (filter === 'all') return true;
      const transactionType = getTransactionType(transaction);
      return transactionType === filter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'desc' 
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

  const totalSent = transactions
    .filter(t => getTransactionType(t) === 'sent')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReceived = transactions
    .filter(t => getTransactionType(t) === 'received')
    .reduce((sum, t) => sum + t.amount, 0);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground mt-1">
            {user?.isAdmin 
              ? "View all Astra transactions across the platform"
              : "View all your Astra transactions and transfers"
            }
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                <ArrowUpDown className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-mono font-bold">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Send className="w-4 h-4 text-green-600 rotate-180" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-2xl font-mono font-bold text-green-600">
                  +{totalReceived.toLocaleString()} ⭐
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                <Send className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-mono font-bold text-red-600">
                  -{totalSent.toLocaleString()} ⭐
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter & Sort
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={filter} onValueChange={(value: 'all' | 'sent' | 'received') => setFilter(value)}>
                <SelectTrigger data-testid="select-transaction-filter">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="sent">Sent Only</SelectItem>
                  <SelectItem value="received">Received Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              data-testid="button-sort-order"
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Transactions 
            {filter !== 'all' && <Badge variant="secondary" className="ml-2">{filter}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No transactions found</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? "You haven't made any transactions yet. Send some Astras to get started!"
                  : `No ${filter} transactions found. Try changing the filter.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => {
                const transactionType = getTransactionType(transaction);
                const isAdminViewingAll = user?.isAdmin && 'fromUserEmail' in transaction;
                const userInitials = getUserInitials(transaction.counterpartEmail);
                const formattedDate = format(new Date(transaction.createdAt), 'MMM d, yyyy • h:mm a');
                
                return (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                    data-testid={`transaction-${transaction.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-full",
                        isAdminViewingAll
                          ? "bg-blue-100 dark:bg-blue-900/20"
                          : transactionType === 'received' 
                            ? "bg-green-100 dark:bg-green-900/20"
                            : "bg-red-100 dark:bg-red-900/20"
                      )}>
                        <Send className={cn(
                          "w-5 h-5",
                          isAdminViewingAll
                            ? "text-blue-600"
                            : transactionType === 'received' 
                              ? "text-green-600 rotate-180"
                              : "text-red-600"
                        )} />
                      </div>
                      
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h4 className="font-medium">{getTransactionTitle(transaction, transactionType)}</h4>
                        <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={cn(
                        "text-xl font-mono font-bold",
                        isAdminViewingAll ? "" : getAmountColor(transactionType)
                      )}>
                        {isAdminViewingAll ? '' : getAmountPrefix(transactionType)}{transaction.amount.toLocaleString()} ⭐
                      </p>
                      {!isAdminViewingAll && (
                        <Badge 
                          variant={transactionType === 'received' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {transactionType}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}