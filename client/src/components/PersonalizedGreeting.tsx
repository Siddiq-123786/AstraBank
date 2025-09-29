import { useAuth } from "@/hooks/use-auth";
import AstraMascot from "./AstraMascot";
import { Badge } from "@/components/ui/badge";

export default function PersonalizedGreeting() {
  const { user } = useAuth();

  if (!user) return null;

  // Extract first name from email and handle special cases
  const getDisplayName = (email: string): string => {
    // Special case for Cosette -> Cozy
    if (email.toLowerCase().includes('cosette')) {
      return 'Cozy';
    }
    
    // Extract name from email (e.g., siddiq.a@domain -> Siddiq)
    const emailPart = email.split('@')[0];
    const namePart = emailPart.split('.')[0];
    
    // Capitalize first letter
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  const displayName = getDisplayName(user.email);

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-card border" data-testid="greeting-display">
      <AstraMascot size="md" greeting={true} />
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">Welcome back!</p>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground" data-testid="text-greeting-name">
            Hi {displayName}!
          </p>
          {user.isFounder && (
            <Badge variant="default" className="bg-accent text-accent-foreground text-xs">
              Founder
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}