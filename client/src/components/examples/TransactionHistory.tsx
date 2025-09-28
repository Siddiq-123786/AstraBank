import TransactionHistory from '../TransactionHistory';

export default function TransactionHistoryExample() {
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
    },
    {
      id: '4',
      type: 'earn' as const,
      amount: 200,
      description: 'Dividend from Green Energy Co',
      timestamp: '3 days ago',
      initials: 'GE'
    }
  ];

  return <TransactionHistory transactions={mockTransactions} />;
}