import SendAstraModal from '../SendAstraModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SendAstraModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  
  const mockFriend = {
    id: '1',
    name: 'Emma Chen',
    email: 'emma.chen@astranova.edu',
    initials: 'EC'
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Send Modal</Button>
      <SendAstraModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        selectedFriend={mockFriend}
        onSend={(id, amount, message) => console.log('Send:', id, amount, message)}
      />
    </div>
  );
}