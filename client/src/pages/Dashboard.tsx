import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import WalletCard from "@/components/WalletCard";
import TransactionHistory from "@/components/TransactionHistory";
import FriendCard from "@/components/FriendCard";
import CompanyCard from "@/components/CompanyCard";
import SendAstraModal from "@/components/SendAstraModal";
import AddFriendModal from "@/components/AddFriendModal";
import CreateCompanyModal from "@/components/CreateCompanyModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
// Remove User import as we're using a custom type now

export default function Dashboard() {
  const { user } = useAuth();
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [createCompanyModalOpen, setCreateCompanyModalOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);

  // Fetch friends data
  const { data: friends = [], isLoading: friendsLoading } = useQuery<{ id: string; email: string; balance: number; friendshipStatus: string; requestedByCurrent: boolean }[]>({
    queryKey: ['/api/friends'],
  });

  // Empty states for features not yet implemented
  const transactions: any[] = [];
  const companies: any[] = [];

  const handleSendToFriend = (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    setSelectedFriend(friend);
    setSendModalOpen(true);
  };

  const handleSend = (friendId: string, amount: number, message: string) => {
    console.log('Sending:', amount, 'to:', friendId, 'message:', message);
    // TODO: Implement actual send functionality
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
            onSend={() => setSendModalOpen(true)}
            onAdd={() => setAddFriendModalOpen(true)}
            onInvest={() => {/* TODO: Navigate to investments */}}
          />
        </div>
        <div className="lg:col-span-2">
          <TransactionHistory transactions={transactions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Friends</h2>
            <Button size="sm" onClick={() => setAddFriendModalOpen(true)}>
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
                  onSend={handleSendToFriend}
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

      <SendAstraModal
        isOpen={sendModalOpen}
        onClose={() => {
          setSendModalOpen(false);
          setSelectedFriend(null);
        }}
        selectedFriend={selectedFriend}
        onSend={handleSend}
      />

      <AddFriendModal
        isOpen={addFriendModalOpen}
        onClose={() => setAddFriendModalOpen(false)}
      />

      <CreateCompanyModal
        isOpen={createCompanyModalOpen}
        onClose={() => setCreateCompanyModalOpen(false)}
        onCreate={handleCreateCompany}
      />
    </div>
  );
}