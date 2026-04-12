import { useState, useEffect } from "react";

const POLL_INTERVAL_MS = 60_000;

// Module-level shared state — one fetch shared across all hook instances
let cachedPrice: number | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<(price: number | null) => void>();

async function fetchPrice(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
    );
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    return typeof data?.solana?.usd === "number" ? data.solana.usd : null;
  } catch {
    return null;
  }
}

async function fetchAndNotify() {
  const price = await fetchPrice();
  cachedPrice = price;
  listeners.forEach((l) => l(price));
}

function startPolling() {
  if (intervalId !== null) return;
  void fetchAndNotify();
  intervalId = setInterval(() => void fetchAndNotify(), POLL_INTERVAL_MS);
}

function stopPolling() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/** Returns the live SOL/USD price, or null if unavailable. */
export function useSolPrice(): number | null {
  const [price, setPrice] = useState<number | null>(cachedPrice);

  useEffect(() => {
    listeners.add(setPrice);
    startPolling();
    return () => {
      listeners.delete(setPrice);
      if (listeners.size === 0) stopPolling();
    };
  }, []);

  return price;
}
