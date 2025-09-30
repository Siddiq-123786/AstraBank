import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, TrendingUp, Users, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Company = {
  id: string;
  name: string;
  description: string;
  category: string;
  fundingGoal: number;
  currentFunding: number;
  teamEmails: string;
  foundedAt: string;
  createdById: string;
  creatorEmail: string;
};

export default function Companies() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const { data: companies = [], isLoading, error } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const res = await apiRequest('DELETE', `/api/companies/${companyId}`, {});
      return res.json();
    },
    onSuccess: (data: { refundedInvestors: number; totalRefunded: number }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      let description = "The company has been removed successfully";
      if (data.refundedInvestors > 0) {
        description = `Refunded ${data.totalRefunded.toLocaleString()} Astras to ${data.refundedInvestors} investor${data.refundedInvestors > 1 ? 's' : ''}`;
      }
      
      toast({
        title: "Company deleted",
        description: description,
      });
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete company",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });

  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (companyToDelete) {
      deleteCompanyMutation.mutate(companyToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Browse and invest in student companies</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading companies...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Browse and invest in student companies</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Unable to load companies</div>
        </div>
      </div>
    );
  }

  const getFundingPercentage = (company: Company) => {
    return Math.round((company.currentFunding / company.fundingGoal) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Browse and invest in student companies</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Building className="w-4 h-4" />
          {companies.length} companies
        </Badge>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No companies yet</h3>
              <p className="text-muted-foreground">Be the first to create a student company!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Card key={company.id} className="hover-elevate" data-testid={`company-card-${company.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate" data-testid={`company-name-${company.id}`}>
                      {company.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {company.category}
                      </Badge>
                    </CardDescription>
                  </div>
                  {user?.isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteClick(company)}
                      data-testid={`button-delete-${company.id}`}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`company-desc-${company.id}`}>
                  {company.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Funding Progress</span>
                    <span className="font-medium">{getFundingPercentage(company)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${Math.min(getFundingPercentage(company), 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{company.currentFunding.toLocaleString()} Astras</span>
                    <span>{company.fundingGoal.toLocaleString()} Goal</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span className="truncate">{company.teamEmails.split(',').length + 1} team members</span>
                </div>

                <div className="text-xs text-muted-foreground" data-testid={`company-creator-${company.id}`}>
                  Created by <span className="font-medium">{company.creatorEmail}</span>
                </div>

                <div className="text-xs text-muted-foreground">
                  Founded {new Date(company.foundedAt).toLocaleDateString()}
                </div>

                {getFundingPercentage(company) < 100 && (
                  <Button 
                    size="sm" 
                    className="w-full"
                    data-testid={`button-invest-${company.id}`}
                  >
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Invest
                  </Button>
                )}
                {getFundingPercentage(company) >= 100 && (
                  <Badge variant="default" className="w-full justify-center">
                    Fully Funded!
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{companyToDelete?.name}</strong>? 
              <br /><br />
              All investors will be automatically refunded their full investment amounts. This action cannot be undone and the company will no longer be visible to users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCompanyMutation.isPending}
            >
              {deleteCompanyMutation.isPending ? "Deleting..." : "Delete & Refund"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
