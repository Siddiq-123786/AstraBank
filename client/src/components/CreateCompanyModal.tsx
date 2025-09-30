import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Building, Plus, Trash2, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreateCompanyRequest } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EquityAllocation {
  email: string;
  percentage: string;
}

export default function CreateCompanyModal({ open, onOpenChange }: CreateCompanyModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [fundingGoal, setFundingGoal] = useState('');
  const [teamEmails, setTeamEmails] = useState('');
  const [investorPoolPercentage, setInvestorPoolPercentage] = useState('30');
  const [equityAllocations, setEquityAllocations] = useState<EquityAllocation[]>([
    { email: '', percentage: '' }
  ]);
  const { toast } = useToast();

  const createCompanyMutation = useMutation({
    mutationFn: (data: CreateCompanyRequest) => 
      apiRequest('POST', '/api/companies', data),
    onSuccess: () => {
      toast({
        title: "Company created!",
        description: "Your company has been successfully created and is now available for investment.",
      });
      
      // Invalidate companies data
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      
      // Reset form
      setName('');
      setDescription('');
      setCategory('');
      setFundingGoal('');
      setTeamEmails('');
      setInvestorPoolPercentage('30');
      setEquityAllocations([{ email: '', percentage: '' }]);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create company",
        description: error.message || "There was an error creating your company. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addEquityAllocation = () => {
    setEquityAllocations([...equityAllocations, { email: '', percentage: '' }]);
  };

  const removeEquityAllocation = (index: number) => {
    setEquityAllocations(equityAllocations.filter((_, i) => i !== index));
  };

  const updateEquityAllocation = (index: number, field: 'email' | 'percentage', value: string) => {
    const updated = [...equityAllocations];
    updated[index][field] = value;
    setEquityAllocations(updated);
  };

  const isValidNumericInput = (value: string): boolean => {
    if (!value || !value.trim()) return false;
    const trimmed = value.trim();
    const num = Number(trimmed);
    return !isNaN(num) && isFinite(num) && num >= 0 && /^\d*\.?\d+$/.test(trimmed);
  };

  const getTotalEquityPercentage = () => {
    const founderTotal = equityAllocations.reduce((sum, alloc) => {
      if (!isValidNumericInput(alloc.percentage)) return sum;
      const percentage = Number(alloc.percentage);
      return sum + percentage;
    }, 0);
    const investorPool = isValidNumericInput(investorPoolPercentage) ? Number(investorPoolPercentage) : 0;
    return founderTotal + investorPool;
  };

  const getTotalEquityBasisPoints = () => {
    const founderBps = equityAllocations.reduce((sum, alloc) => {
      if (!isValidNumericInput(alloc.percentage)) return sum;
      const bps = Math.round(Number(alloc.percentage) * 100);
      return sum + bps;
    }, 0);
    const investorPoolValue = isValidNumericInput(investorPoolPercentage) ? Number(investorPoolPercentage) : 0;
    const investorPoolBps = Math.round(investorPoolValue * 100);
    return founderBps + investorPoolBps;
  };

  const validateEmail = (email: string): boolean => {
    const trimmed = email.trim().toLowerCase();
    const atCount = (trimmed.match(/@/g) || []).length;
    const parts = trimmed.split('@');
    return (
      atCount === 1 &&
      parts.length === 2 &&
      parts[0].length > 0 &&
      parts[1] === 'astranova.org' &&
      /^[a-z0-9._-]+$/.test(parts[0])
    );
  };

  const validateTeamEmails = () => {
    if (!teamEmails.trim()) return false;
    const emails = teamEmails.split(',').map(e => e.trim()).filter(e => e.length > 0);
    return emails.length >= 1 && emails.every(e => validateEmail(e));
  };

  const validateEquityAllocations = () => {
    const validAllocations = equityAllocations.filter(alloc => {
      if (!alloc.email.trim() || !alloc.percentage.trim()) return false;
      if (!validateEmail(alloc.email)) return false;
      if (!isValidNumericInput(alloc.percentage)) return false;
      const percentage = Number(alloc.percentage);
      return percentage >= 0.01 && percentage <= 100;
    });
    return validAllocations.length > 0;
  };

  const validateInvestorPool = () => {
    if (!investorPoolPercentage.trim()) return true;
    if (!isValidNumericInput(investorPoolPercentage)) return false;
    const investorPool = Number(investorPoolPercentage);
    return investorPool >= 0 && investorPool <= 100;
  };

  const handleCreate = () => {
    if (!name || !description || !category || !fundingGoal || !teamEmails) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!validateTeamEmails()) {
      toast({
        title: "Invalid team members",
        description: "Please enter at least one valid @astranova.org email address.",
        variant: "destructive",
      });
      return;
    }

    if (!validateInvestorPool()) {
      toast({
        title: "Invalid investor pool",
        description: "Investor pool percentage must be between 0 and 100.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEquityAllocations()) {
      toast({
        title: "Invalid equity allocations",
        description: "Please add at least one valid equity allocation with a positive percentage and valid @astranova.org email.",
        variant: "destructive",
      });
      return;
    }

    const investorPoolValue = isValidNumericInput(investorPoolPercentage) ? Number(investorPoolPercentage) : 0;
    const investorPoolBps = Math.round(investorPoolValue * 100);
    
    const equityAllocationsData = equityAllocations
      .filter(alloc => {
        if (!alloc.email.trim() || !alloc.percentage.trim()) return false;
        if (!validateEmail(alloc.email)) return false;
        if (!isValidNumericInput(alloc.percentage)) return false;
        const percentage = Number(alloc.percentage);
        return percentage >= 0.01 && percentage <= 100;
      })
      .map(alloc => ({
        email: alloc.email.trim(),
        basisPoints: Math.round(Number(alloc.percentage) * 100)
      }));

    const totalBps = equityAllocationsData.reduce((sum, alloc) => sum + alloc.basisPoints, 0) + investorPoolBps;
    if (totalBps > 10001) {
      toast({
        title: "Invalid equity allocation",
        description: `Total equity is ${(totalBps / 100).toFixed(2)}% which exceeds 100%. This can happen due to rounding. Please adjust your allocations slightly.`,
        variant: "destructive",
      });
      return;
    }

    createCompanyMutation.mutate({
      name,
      description,
      category,
      fundingGoal: parseInt(fundingGoal),
      teamEmails,
      investorPoolBps,
      equityAllocations: equityAllocationsData,
    });
  };

  const categories = [
    'EdTech', 'Green Energy', 'AI/ML', 'Health Tech', 'Gaming', 
    'Social Impact', 'FinTech', 'Art & Design', 'Sports', 'Other'
  ];

  const totalBps = getTotalEquityBasisPoints();
  const totalEquityPercent = totalBps / 100;
  const equityIsValid = totalBps <= 10001;
  
  const isFormValid = 
    name.trim() && 
    description.trim() && 
    category && 
    fundingGoal && 
    validateTeamEmails() && 
    validateInvestorPool() && 
    validateEquityAllocations() && 
    equityIsValid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Create Company
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              placeholder="Enter company name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-company-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What does your company do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-testid="input-company-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="select-company-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="funding-goal" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Funding Goal (⭐ Astras)
            </Label>
            <Input
              id="funding-goal"
              type="number"
              placeholder="10000"
              value={fundingGoal}
              onChange={(e) => setFundingGoal(e.target.value)}
              className="font-mono"
              data-testid="input-funding-goal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-emails">Team Members (@astranova.org emails)</Label>
            <Textarea
              id="team-emails"
              placeholder="friend1@astranova.org, friend2@astranova.org"
              value={teamEmails}
              onChange={(e) => setTeamEmails(e.target.value)}
              rows={2}
              data-testid="input-team-emails"
            />
            <p className="text-xs text-muted-foreground">
              At least one team member required (minimum 2 people total including you)
            </p>
          </div>

          <div className="space-y-3 p-4 border rounded-md">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Equity Distribution</Label>
              <div className={`text-sm font-medium ${equityIsValid ? 'text-muted-foreground' : 'text-destructive'}`}>
                Total: {totalEquityPercent.toFixed(2)}%
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="investor-pool">Investor Pool (%)</Label>
              <Input
                id="investor-pool"
                type="number"
                placeholder="30"
                value={investorPoolPercentage}
                onChange={(e) => setInvestorPoolPercentage(e.target.value)}
                min="0"
                max="100"
                step="0.1"
                className="font-mono"
                data-testid="input-investor-pool"
              />
              <p className="text-xs text-muted-foreground">
                Reserved for future investors (automatically distributed)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Founder/Team Equity Allocations</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEquityAllocation}
                  data-testid="button-add-allocation"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </Label>

              <div className="space-y-2">
                {equityAllocations.map((allocation, index) => (
                  <div key={index} className="flex gap-2" data-testid={`equity-allocation-${index}`}>
                    <Input
                      placeholder="email@astranova.org"
                      value={allocation.email}
                      onChange={(e) => updateEquityAllocation(index, 'email', e.target.value)}
                      className="flex-1"
                      data-testid={`input-allocation-email-${index}`}
                    />
                    <Input
                      type="number"
                      placeholder="%"
                      value={allocation.percentage}
                      onChange={(e) => updateEquityAllocation(index, 'percentage', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-24 font-mono"
                      data-testid={`input-allocation-percentage-${index}`}
                    />
                    {equityAllocations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEquityAllocation(index)}
                        data-testid={`button-remove-allocation-${index}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Assign ownership to founders and team members
              </p>
            </div>

            {!equityIsValid && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Total equity exceeds 100%. Please adjust your allocations.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!isFormValid || createCompanyMutation.isPending}
              className="flex-1"
              data-testid="button-create-company"
            >
              {createCompanyMutation.isPending ? 'Creating...' : 'Create Company'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}