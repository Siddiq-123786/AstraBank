import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, TrendingUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'invest' | 'earn';
  amount: number;
  description: string;
  timestamp: string;
  avatar?: string;
  initials: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const getIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'send':
      case 'receive':
        return <Send className="w-4 h-4" />;
      case 'invest':
        return <TrendingUp className="w-4 h-4" />;
      case 'earn':
        return <Plus className="w-4 h-4" />;
    }
  };

  const getAmountColor = (type: Transaction['type']) => {
    return type === 'receive' || type === 'earn' ? 'text-green-600' : 'text-foreground';
  };

  const getAmountPrefix = (type: Transaction['type']) => {
    return type === 'receive' || type === 'earn' ? '+' : '-';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((transaction) => (
          <div 
            key={transaction.id} 
            className="flex items-center justify-between p-3 rounded-lg hover-elevate bg-muted/20"
            data-testid={`transaction-${transaction.id}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                {getIcon(transaction.type)}
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={transaction.avatar} />
                  <AvatarFallback className="text-xs">{transaction.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">{transaction.timestamp}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={cn("font-mono font-medium", getAmountColor(transaction.type))}>
                {getAmountPrefix(transaction.type)}{transaction.amount.toLocaleString()} ⭐
              </p>
              <Badge variant="outline" className="text-xs">
                {transaction.type}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}