import FriendCard from '../FriendCard';

export default function FriendCardExample() {
  const mockFriend = {
    id: '1',
    name: 'Emma Chen',
    email: 'emma.chen@astranova.edu',
    initials: 'EC',
    lastActive: '2 hours ago'
  };

  return (
    <FriendCard 
      friend={mockFriend}
      onSend={(id) => console.log('Send to friend:', id)}
    />
  );
}