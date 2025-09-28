import { Star } from "lucide-react";

interface AstraMascotProps {
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  greeting?: boolean;
  className?: string;
}

export default function AstraMascot({ size = "md", animate = false, greeting = false, className = "" }: AstraMascotProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  const animationClass = animate ? "animate-pulse" : "";
  const greetingClass = greeting ? "hover:scale-110 transition-transform duration-300" : "";

  return (
    <div className={`relative ${className}`}>
      {/* Main star mascot */}
      <Star 
        className={`${sizeClasses[size]} text-accent ${animationClass} ${greetingClass} fill-current`}
        data-testid="mascot-astra"
      />
      
      {greeting && (
        <>
          {/* Sparkle effects for greeting */}
          <div className="absolute -top-1 -right-1 w-2 h-2">
            <Star className="w-full h-full text-accent fill-current animate-ping" />
          </div>
          <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5">
            <Star className="w-full h-full text-accent fill-current animate-ping" style={{ animationDelay: "0.5s" }} />
          </div>
        </>
      )}
    </div>
  );
}