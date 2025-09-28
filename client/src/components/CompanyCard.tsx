import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, Users } from "lucide-react";

interface Company {
  id: string;
  name: string;
  description: string;
  category: string;
  logo?: string;
  initials: string;
  fundingGoal: number;
  currentFunding: number;
  investors: number;
  roi: number;
  founded: string;
}

interface CompanyCardProps {
  company: Company;
  onInvest: (companyId: string) => void;
}

export default function CompanyCard({ company, onInvest }: CompanyCardProps) {
  const fundingProgress = (company.currentFunding / company.fundingGoal) * 100;

  return (
    <Card className="w-full hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={company.logo} />
              <AvatarFallback>{company.initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg" data-testid={`text-company-name-${company.id}`}>
                {company.name}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {company.category}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium text-sm">+{company.roi}%</span>
            </div>
            <p className="text-xs text-muted-foreground">ROI</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{company.description}</p>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Funding Progress</span>
            <span className="text-sm font-mono">
              {company.currentFunding.toLocaleString()} / {company.fundingGoal.toLocaleString()} ⭐
            </span>
          </div>
          <Progress value={fundingProgress} className="h-2" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{company.investors} investors</span>
            </div>
            <span>Founded {company.founded}</span>
          </div>
          <Button
            onClick={() => onInvest(company.id)}
            data-testid={`button-invest-${company.id}`}
          >
            Invest
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}