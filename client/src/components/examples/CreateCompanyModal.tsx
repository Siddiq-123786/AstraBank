import CreateCompanyModal from '../CreateCompanyModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function CreateCompanyModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Create Company</Button>
      <CreateCompanyModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCreate={(company) => console.log('Create company:', company)}
      />
    </div>
  );
}