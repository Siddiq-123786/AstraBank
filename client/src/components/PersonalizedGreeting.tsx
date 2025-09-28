import { useAuth } from "@/hooks/use-auth";
import AstraMascot from "./AstraMascot";

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
      <div>
        <p className="text-sm text-muted-foreground">Welcome back!</p>
        <p className="font-semibold text-foreground" data-testid="text-greeting-name">
          Hi {displayName}!
        </p>
      </div>
    </div>
  );
}