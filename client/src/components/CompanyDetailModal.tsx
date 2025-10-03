import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Company } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, Users, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CompanyDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
}

interface Investor {
  userId: string;
  userEmail: string;
  username: string | null;
  totalInvested: number;
  basisPoints: number;
}

function getUserInitials(email: string): string {
  const username = email.split('@')[0];
  return username.slice(0, 2).toUpperCase();
}

function getUsername(email: string): string {
  return email.split('@')[0];
}

export default function CompanyDetailModal({ open, onOpenChange, company }: CompanyDetailModalProps) {
  const { data: investors = [], isLoading } = useQuery<Investor[]>({
    queryKey: ['/api/companies', company?.id, 'investors'],
    enabled: !!company && open,
  });

  if (!company) return null;

  const fundingProgress = (company.currentFunding / company.fundingGoal) * 100;
  const initials = company.name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
  const founded = new Date(company.foundedAt).getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]" data-testid="company-detail-modal">
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <DialogTitle className="text-2xl" data-testid="company-name">
                  {company.name}
                </DialogTitle>
                <Badge variant="secondary" className="text-xs mt-1">
                  {company.category}
                </Badge>
                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                  <Users className="w-4 h-4" />
                  <span className="font-medium text-sm">{founded}</span>
                  <span className="text-xs">Founded</span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Company Description */}
            <div>
              <h3 className="text-sm font-medium mb-2">About</h3>
              <p className="text-sm text-muted-foreground">{company.description}</p>
            </div>

            {/* Funding Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Funding Progress</h3>
                <span className="text-sm font-mono">
                  {company.currentFunding.toLocaleString()} / {company.fundingGoal.toLocaleString()} ⭐
                </span>
              </div>
              <Progress value={fundingProgress} className="h-2" />
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{fundingProgress.toFixed(1)}% funded</span>
                </div>
              </div>
            </div>

            {/* Investors List */}
            <div>
              <h3 className="text-sm font-medium mb-3">Investors ({investors.length})</h3>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading investors...
                </div>
              ) : investors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No investors yet
                </div>
              ) : (
                <div className="space-y-2">
                  {investors.map((investor) => (
                    <Card key={investor.userId} className="hover-elevate" data-testid={`investor-${investor.userId}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="text-sm">
                                {getUserInitials(investor.userEmail)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm" data-testid={`investor-name-${investor.userId}`}>
                                {investor.username || getUsername(investor.userEmail)}
                              </p>
                              <p className="text-xs text-muted-foreground" data-testid={`investor-email-${investor.userId}`}>
                                {investor.userEmail}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="font-mono font-medium text-sm" data-testid={`investor-amount-${investor.userId}`}>
                                {investor.totalInvested.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground" data-testid={`investor-equity-${investor.userId}`}>
                              {(investor.basisPoints / 100).toFixed(2)}% equity
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
