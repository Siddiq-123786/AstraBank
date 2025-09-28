import { useState } from "react";
import WalletCard from "@/components/WalletCard";
import TransactionHistory from "@/components/TransactionHistory";
import FriendCard from "@/components/FriendCard";
import CompanyCard from "@/components/CompanyCard";
import SendAstraModal from "@/components/SendAstraModal";
import AddFriendModal from "@/components/AddFriendModal";
import CreateCompanyModal from "@/components/CreateCompanyModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [createCompanyModalOpen, setCreateCompanyModalOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);

  // TODO: Remove mock data - replace with real data from backend
  const mockTransactions = [
    {
      id: '1',
      type: 'send' as const,
      amount: 150,
      description: 'Sent to Emma Chen',
      timestamp: '2 hours ago',
      initials: 'EC'
    },
    {
      id: '2',
      type: 'receive' as const,
      amount: 300,
      description: 'Received from Alex Kumar',
      timestamp: '1 day ago',
      initials: 'AK'
    },
    {
      id: '3',
      type: 'invest' as const,
      amount: 500,
      description: 'Invested in Nova Tech Club',
      timestamp: '2 days ago',
      initials: 'NT'
    }
  ];

  const mockFriends = [
    {
      id: '1',
      name: 'Emma Chen',
      email: 'emma.chen@astranova.edu',
      initials: 'EC',
      lastActive: '2 hours ago'
    },
    {
      id: '2',
      name: 'Alex Kumar',
      email: 'alex.kumar@astranova.edu',
      initials: 'AK',
      lastActive: '1 day ago'
    }
  ];

  const mockCompanies = [
    {
      id: '1',
      name: 'Nova Tech Club',
      description: 'Building the next generation of educational technology',
      category: 'EdTech',
      initials: 'NT',
      fundingGoal: 10000,
      currentFunding: 6500,
      investors: 23,
      roi: 15.2,
      founded: '2024'
    },
    {
      id: '2',
      name: 'Green Energy Co',
      description: 'Sustainable energy solutions for the future',
      category: 'Green Energy',
      initials: 'GE',
      fundingGoal: 15000,
      currentFunding: 8200,
      investors: 31,
      roi: 22.8,
      founded: '2024'
    }
  ];

  const handleSendToFriend = (friendId: string) => {
    const friend = mockFriends.find(f => f.id === friendId);
    setSelectedFriend(friend);
    setSendModalOpen(true);
  };

  const handleSend = (friendId: string, amount: number, message: string) => {
    console.log('Sending:', amount, 'to:', friendId, 'message:', message);
    // TODO: Implement actual send functionality
  };

  const handleAddFriend = (email: string) => {
    console.log('Adding friend:', email);
    // TODO: Implement actual add friend functionality
  };

  const handleCreateCompany = (company: any) => {
    console.log('Creating company:', company);
    // TODO: Implement actual create company functionality
  };

  const handleInvest = (companyId: string) => {
    console.log('Investing in company:', companyId);
    // TODO: Implement investment modal
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <WalletCard
            balance={2500}
            onSend={() => setSendModalOpen(true)}
            onAdd={() => setAddFriendModalOpen(true)}
            onInvest={() => {/* TODO: Navigate to investments */}}
          />
        </div>
        <div className="lg:col-span-2">
          <TransactionHistory transactions={mockTransactions} />
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
            {mockFriends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onSend={handleSendToFriend}
              />
            ))}
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
            {mockCompanies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onInvest={handleInvest}
              />
            ))}
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
        onAdd={handleAddFriend}
      />

      <CreateCompanyModal
        isOpen={createCompanyModalOpen}
        onClose={() => setCreateCompanyModalOpen(false)}
        onCreate={handleCreateCompany}
      />
    </div>
  );
}