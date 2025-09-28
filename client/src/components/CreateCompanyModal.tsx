import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Building } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreateCompanyRequest } from "@shared/schema";

interface CreateCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateCompanyModal({ open, onOpenChange }: CreateCompanyModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [fundingGoal, setFundingGoal] = useState('');
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

  const handleCreate = () => {
    if (name && description && category && fundingGoal) {
      createCompanyMutation.mutate({
        name,
        description,
        category,
        fundingGoal: parseInt(fundingGoal),
      });
    }
  };

  const categories = [
    'EdTech', 'Green Energy', 'AI/ML', 'Health Tech', 'Gaming', 
    'Social Impact', 'FinTech', 'Art & Design', 'Sports', 'Other'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
            <Label htmlFor="team-emails">Team Members (Gmail addresses)</Label>
            <Textarea
              id="team-emails"
              placeholder="friend1@astranova.edu, friend2@astranova.edu"
              rows={2}
              data-testid="input-team-emails"
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple emails with commas
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!name || !description || !category || !fundingGoal}
              className="flex-1"
              data-testid="button-create-company"
            >
              Create Company
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}