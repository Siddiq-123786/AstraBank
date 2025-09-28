import WalletCard from '../WalletCard';

export default function WalletCardExample() {
  return (
    <WalletCard 
      balance={2500}
      onSend={() => console.log('Send clicked')}
      onAdd={() => console.log('Add friend clicked')}
      onInvest={() => console.log('Invest clicked')}
    />
  );
}