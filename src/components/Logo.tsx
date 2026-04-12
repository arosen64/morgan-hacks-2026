import logoSrc from "@/assets/logo_black.png";

type LogoSize = "sm" | "lg";

interface LogoProps {
  size?: LogoSize;
}

const sizeClasses: Record<LogoSize, string> = {
  sm: "h-14 w-auto",
  lg: "h-24 w-auto",
};

export function Logo({ size = "lg" }: LogoProps) {
  return <img src={logoSrc} alt="Potlock" className={sizeClasses[size]} />;
}
