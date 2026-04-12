import { useState } from "react";
import { useQuery } from "convex/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JoinPoolForm } from "./JoinPoolForm";
import { CreatePoolFlow } from "./CreatePoolFlow";

interface MainMenuProps {
  onSelectPool: (poolId: Id<"pools">) => void;
}

type JoinPhase = "input" | "joining";

function parsePoolId(value: string): string {
  try {
    const url = new URL(value);
    const param = url.searchParams.get("pool");
    if (param) return param;
  } catch {
    // not a URL — treat raw value as pool ID
  }
  return value.trim();
}

export function MainMenu({ onSelectPool }: MainMenuProps) {
  const { disconnect, publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? "";
  const pools = useQuery(api.members.getPoolsByWallet, {
    wallet: walletAddress,
  });

  const [joinOpen, setJoinOpen] = useState(false);
  const [joinInput, setJoinInput] = useState("");
  const [joinPhase, setJoinPhase] = useState<JoinPhase>("input");
  // ID being looked up — drives the reactive query below
  const [lookupPoolId, setLookupPoolId] = useState<Id<"pools"> | null>(null);
  // ID confirmed by the user and passed to JoinPoolForm
  const [confirmedPoolId, setConfirmedPoolId] = useState<Id<"pools"> | null>(
    null,
  );
  const [inputError, setInputError] = useState<string | null>(null);

  const poolData = useQuery(
    api.pools.getPoolWithMemberCount,
    lookupPoolId !== null ? { poolId: lookupPoolId } : "skip",
  );

  // Derived from query state — no useEffect needed
  const isLooking = lookupPoolId !== null && poolData === undefined;
  const lookupNotFound = lookupPoolId !== null && poolData === null;
  const lookupFound =
    lookupPoolId !== null && poolData !== undefined && poolData !== null;

  function handleClose() {
    setJoinOpen(false);
    setJoinInput("");
    setJoinPhase("input");
    setLookupPoolId(null);
    setConfirmedPoolId(null);
    setInputError(null);
  }

  function handleLookup() {
    const parsed = parsePoolId(joinInput);
    if (parsed.length < 10) {
      setInputError("Enter a valid pool ID or invite link.");
      return;
    }
    setInputError(null);
    setLookupPoolId(parsed as Id<"pools">);
  }

  function handleConfirm() {
    setConfirmedPoolId(lookupPoolId);
    setJoinPhase("joining");
  }

  function handleJoinSuccess() {
    const poolId = confirmedPoolId!;
    handleClose();
    onSelectPool(poolId);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="border-b border-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-violet-500" />
          <span className="text-lg font-semibold tracking-tight">Potlock</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </header>

      {/* Hero section */}
      <div className="px-8 pt-16 pb-10 max-w-xl mx-auto text-center flex flex-col items-center gap-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700">
          <div className="size-2 rounded-full bg-violet-500" />
          Investment Pools
        </div>
        <h1 className="text-5xl font-bold tracking-tight">My Pools</h1>
        <p className="text-lg text-muted-foreground max-w-sm">
          Manage your investment pools or start a new one with people you trust.
        </p>
        <div className="flex gap-3 mt-2">
          <Button
            size="lg"
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => setCreateOpen(true)}
          >
            + Create Pool
          </Button>
          <Button size="lg" variant="outline" onClick={() => setJoinOpen(true)}>
            Join Pool
          </Button>
        </div>
      </div>

      {/* Pool list */}
      <div className="px-8 max-w-xl mx-auto pb-16">
        {pools === undefined ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : pools.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-20 flex flex-col items-center gap-3 text-center">
              <div className="size-12 rounded-full bg-violet-50 flex items-center justify-center">
                <div className="size-6 rounded-full border-2 border-violet-300" />
              </div>
              <p className="font-medium">No pools yet</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                You're not a member of any pools. Create one or ask a manager to
                add you.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {pools.map(({ pool, role }) => (
              <Card
                key={pool._id}
                className="cursor-pointer hover:border-violet-300 hover:shadow-md transition-all group"
                onClick={() => onSelectPool(pool._id)}
              >
                <CardContent className="flex items-center justify-between py-6 px-6">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-lg group-hover:bg-violet-200 transition-colors">
                      {pool.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-base">{pool.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {pool.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={role === "manager" ? "default" : "secondary"}
                      className={
                        role === "manager"
                          ? "bg-violet-600 hover:bg-violet-600"
                          : ""
                      }
                    >
                      {role}
                    </Badge>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      →
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Join Pool modal */}
      {joinOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">
                  {joinPhase === "input" ? "Join a Pool" : "Enter Your Name"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {joinPhase === "input"
                    ? "Paste an invite link or enter a pool ID."
                    : "Choose a display name for this pool."}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors ml-4 mt-0.5 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Step: input + lookup result */}
            {joinPhase === "input" && (
              <>
                <input
                  type="text"
                  value={joinInput}
                  onChange={(e) => {
                    setJoinInput(e.target.value);
                    setInputError(null);
                    setLookupPoolId(null); // clear stale lookup on edit
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && joinInput.trim()) handleLookup();
                  }}
                  placeholder="Paste invite link or pool ID…"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  autoFocus
                />

                {/* Inline errors */}
                {inputError && (
                  <p className="text-sm text-red-600 -mt-2">{inputError}</p>
                )}
                {lookupNotFound && (
                  <p className="text-sm text-red-600 -mt-2">
                    Pool not found. Check the ID or invite link.
                  </p>
                )}

                {/* Confirmation panel — appears when lookup succeeds */}
                {lookupFound && poolData && (
                  <div className="rounded-xl border border-border bg-muted/40 px-5 py-4 flex flex-col gap-1">
                    <p className="font-semibold text-base">
                      {poolData.pool.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {poolData.memberCount}{" "}
                      {poolData.memberCount === 1 ? "member" : "members"}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  {lookupFound ? (
                    <Button
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                      onClick={handleConfirm}
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                      disabled={!joinInput.trim() || isLooking}
                      onClick={handleLookup}
                    >
                      {isLooking ? "Looking up…" : "Look Up Pool"}
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Step: joining */}
            {joinPhase === "joining" && confirmedPoolId && (
              <JoinPoolForm
                poolId={confirmedPoolId}
                walletAddress={walletAddress}
                onSuccess={handleJoinSuccess}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
