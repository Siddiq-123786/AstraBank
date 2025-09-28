import astraNovaLogo from "@assets/astra-nova-logo.png";

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

  // Enhanced logo animations
  const logoAnimations = animate ? "animate-pulse" : "";
  const bouncingAnimation = animate ? "animate-bounce" : "";
  const rotateAnimation = animate ? "hover:rotate-12" : "";
  const scaleAnimation = greeting ? "hover:scale-125" : "";
  
  // Combined animation classes
  const animationClasses = `${logoAnimations} ${bouncingAnimation} ${rotateAnimation} ${scaleAnimation} transition-all duration-500 ease-in-out`;

  return (
    <div className={`relative ${className}`}>
      {/* Logo with black background container */}
      <div className={`${sizeClasses[size]} bg-black rounded-full p-1 ${animationClasses}`}>
        <img 
          src={astraNovaLogo}
          alt="Astra Nova"
          className="w-full h-full object-contain"
          data-testid="mascot-astra"
        />
      </div>
    </div>
  );
}