import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import WalletCard from "@/components/WalletCard";
import TransactionHistory from "@/components/TransactionHistory";
import FriendCard from "@/components/FriendCard";
import CompanyCard from "@/components/CompanyCard";
// SendAstraModal removed - now using SendMoneyModal
import AddFriendModal from "@/components/AddFriendModal";
import CreateCompanyModal from "@/components/CreateCompanyModal";
import SendMoneyModal from "@/components/SendMoneyModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
// Remove User import as we're using a custom type now

export default function Dashboard() {
  const { user } = useAuth();
  const [sendMoneyModalOpen, setSendMoneyModalOpen] = useState(false);
  const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [createCompanyModalOpen, setCreateCompanyModalOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");

  // Fetch friends data
  const { data: friends = [], isLoading: friendsLoading } = useQuery<{ id: string; email: string; balance: number; friendshipStatus: string; requestedByCurrent: boolean }[]>({
    queryKey: ['/api/friends'],
  });

  // Fetch transactions data
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
  });
  
  // Empty states for features not yet implemented
  const companies: any[] = [];

  const handleSendMoney = (friendId: string) => {
    setSelectedFriendId(friendId);
    setSendMoneyModalOpen(true);
  };

  // Friend addition is now handled by AddFriendModal

  const handleCreateCompany = (company: any) => {
    console.log('Creating company:', company);
    // TODO: Implement actual create company functionality
  };

  const handleInvest = (companyId: string) => {
    console.log('Investing in company:', companyId);
    // TODO: Implement investment modal
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <WalletCard
            balance={user.balance}
            onSend={() => setSendMoneyModalOpen(true)}
            onAdd={() => setAddFriendModalOpen(true)}
            onInvest={() => {/* TODO: Navigate to investments */}}
          />
        </div>
        <div className="lg:col-span-2">
          <TransactionHistory transactions={transactions.slice(0, 5)} isLoading={transactionsLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Friends</h2>
            <Button 
              size="sm" 
              onClick={() => setAddFriendModalOpen(true)}
              data-testid="button-add-friend"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Friend
            </Button>
          </div>
          <div className="space-y-3">
            {friendsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Loading friends...</p>
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No friends yet. Add some classmates to get started!</p>
              </div>
            ) : (
              friends.map((friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  onSend={handleSendMoney}
                />
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Featured Companies</h2>
            <Button size="sm" onClick={() => setCreateCompanyModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Company
            </Button>
          </div>
          <div className="space-y-4">
            {companies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No companies available. Create the first one!</p>
              </div>
            ) : (
              companies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onInvest={handleInvest}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <SendMoneyModal
        open={sendMoneyModalOpen}
        onOpenChange={setSendMoneyModalOpen}
        selectedFriendId={selectedFriendId}
      />

      <AddFriendModal
        open={addFriendModalOpen}
        onOpenChange={setAddFriendModalOpen}
      />

      <CreateCompanyModal
        open={createCompanyModalOpen}
        onOpenChange={setCreateCompanyModalOpen}
      />
    </div>
  );
}