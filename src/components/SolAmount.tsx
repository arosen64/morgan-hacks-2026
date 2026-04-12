import { useSolPrice } from "@/hooks/useSolPrice";

interface SolAmountProps {
  /** Amount in lamports (1 SOL = 1e9 lamports). */
  lamports?: number;
  /** Amount already in SOL. Use when you already have the decimal value. */
  sol?: number;
  className?: string;
}

/**
 * Renders a SOL amount with its live USD equivalent.
 * Example: "0.2500 SOL ($45.00)"
 * Falls back to "0.2500 SOL" when the price is unavailable.
 */
export function SolAmount({ lamports, sol, className }: SolAmountProps) {
  const solPriceUsd = useSolPrice();

  const solValue = sol ?? (lamports != null ? lamports / 1e9 : 0);
  const usdValue = solPriceUsd != null ? solValue * solPriceUsd : null;

  return (
    <span className={className}>
      {solValue.toFixed(4)} SOL
      {usdValue != null && (
        <span className="text-muted-foreground text-sm">
          {" "}
          (${usdValue.toFixed(2)})
        </span>
      )}
    </span>
  );
}
