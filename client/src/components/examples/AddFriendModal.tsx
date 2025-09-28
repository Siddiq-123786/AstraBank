import AddFriendModal from '../AddFriendModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function AddFriendModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Add Friend Modal</Button>
      <AddFriendModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAdd={(email) => console.log('Add friend:', email)}
      />
    </div>
  );
}