import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Plus, TrendingUp } from "lucide-react";

interface WalletCardProps {
  balance: number;
  onSend: () => void;
  onAdd: () => void;
  onInvest: () => void;
}

export default function WalletCard({ balance, onSend, onAdd, onInvest }: WalletCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-sm text-muted-foreground">Your Balance</CardTitle>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-2xl">⭐</span>
          <span className="text-3xl font-mono font-bold text-accent">{balance.toLocaleString()}</span>
          <span className="text-lg text-muted-foreground">Astras</span>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="flex flex-col gap-1 h-16"
          onClick={onSend}
          data-testid="button-send-astras"
        >
          <Send className="w-4 h-4" />
          <span className="text-xs">Send</span>
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="flex flex-col gap-1 h-16"
          onClick={onAdd}
          data-testid="button-add-friend"
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs">Add Friend</span>
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="flex flex-col gap-1 h-16"
          onClick={onInvest}
          data-testid="button-invest"
        >
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs">Invest</span>
        </Button>
      </CardContent>
    </Card>
  );
}