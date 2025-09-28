import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import WalletCard from "@/components/WalletCard";
import TransactionHistory from "@/components/TransactionHistory";
import FriendCard from "@/components/FriendCard";
import CompanyCard from "@/components/CompanyCard";
import PersonalizedGreeting from "@/components/PersonalizedGreeting";
// SendAstraModal removed - now using SendMoneyModal
import AddFriendModal from "@/components/AddFriendModal";
import CreateCompanyModal from "@/components/CreateCompanyModal";
import InvestmentModal from "@/components/InvestmentModal";
import SendMoneyModal from "@/components/SendMoneyModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ApiTransaction, Company } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const [sendMoneyModalOpen, setSendMoneyModalOpen] = useState(false);
  const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [createCompanyModalOpen, setCreateCompanyModalOpen] = useState(false);
  const [investmentModalOpen, setInvestmentModalOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Fetch friends data
  const { data: friends = [], isLoading: friendsLoading } = useQuery<{ id: string; email: string; balance: number; friendshipStatus: string; requestedByCurrent: boolean }[]>({
    queryKey: ['/api/friends'],
  });

  // Fetch transactions data
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<ApiTransaction[]>({
    queryKey: ['/api/transactions'],
  });
  
  // Fetch companies data
  const { data: companies = [], isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  const handleSendMoney = (friendId: string) => {
    setSelectedFriendId(friendId);
    setSendMoneyModalOpen(true);
  };

  // Friend addition is now handled by AddFriendModal

  // Company creation is now handled by CreateCompanyModal mutation

  const handleInvest = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setSelectedCompany(company);
      setInvestmentModalOpen(true);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <PersonalizedGreeting />
      
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

      <InvestmentModal
        open={investmentModalOpen}
        onOpenChange={setInvestmentModalOpen}
        company={selectedCompany}
      />
    </div>
  );
}