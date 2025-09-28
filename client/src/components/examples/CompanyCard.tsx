import CompanyCard from '../CompanyCard';

export default function CompanyCardExample() {
  const mockCompany = {
    id: '1',
    name: 'Nova Tech Club',
    description: 'Building the next generation of educational technology for students',
    category: 'EdTech',
    initials: 'NT',
    fundingGoal: 10000,
    currentFunding: 6500,
    investors: 23,
    roi: 15.2,
    founded: '2024'
  };

  return (
    <CompanyCard 
      company={mockCompany}
      onInvest={(id) => console.log('Invest in company:', id)}
    />
  );
}