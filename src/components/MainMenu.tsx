import { useState } from "react";
import { useQuery } from "convex/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreatePoolFlow } from "./CreatePoolFlow";
import { JoinPoolForm } from "./JoinPoolForm";
import logoPurple from "@/assets/logo_purple.png";

interface MainMenuProps {
  walletAddress: string;
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

export function MainMenu({ onSelectPool, walletAddress }: MainMenuProps) {
  const { disconnect } = useWallet();
  const pools = useQuery(api.members.getPoolsByWallet, {
    wallet: walletAddress,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinInput, setJoinInput] = useState("");
  const [joinPhase, setJoinPhase] = useState<JoinPhase>("input");
  const [lookupPoolId, setLookupPoolId] = useState<Id<"pools"> | null>(null);
  const [confirmedPoolId, setConfirmedPoolId] = useState<Id<"pools"> | null>(
    null,
  );
  const [inputError, setInputError] = useState<string | null>(null);

  const poolData = useQuery(
    api.pools.getPoolWithMemberCount,
    lookupPoolId !== null ? { poolId: lookupPoolId } : "skip",
  );

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
      setInputError("Enter a valid pot ID or invite link.");
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

  if (createOpen) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col">
        <header className="border-b border-white/50 bg-white/70 backdrop-blur-md px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <img src={logoPurple} alt="Potlock" className="h-25 w-auto" />
          </div>
          <Button variant="ghost" size="sm" onClick={() => disconnect()}>
            Disconnect
          </Button>
        </header>
        <div className="flex-1 flex items-start justify-center px-8 py-10">
          <CreatePoolFlow
            founderWallet={walletAddress}
            onSuccess={(poolId) => {
              setCreateOpen(false);
              onSelectPool(poolId);
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Top nav */}
      <header className="border-b border-white/50 bg-white/70 backdrop-blur-md px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <img src={logoPurple} alt="Potlock" className="h-25 w-auto" />
        </div>
        <Button variant="ghost" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </header>

      {/* Hero section */}
      <div className="relative px-8 pt-16 pb-10 max-w-xl mx-auto text-center flex flex-col items-center gap-4 overflow-hidden">
        {/* Decorative glow behind heading */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-80 h-40 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-300 bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700 shadow-sm shadow-violet-100">
          <div className="size-2 rounded-full bg-violet-500 animate-pulse" />
          Your Pots
        </div>
        <h1 className="text-5xl font-bold tracking-tighter bg-gradient-to-r from-violet-700 via-violet-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">
          My Pots
        </h1>
        <p className="text-base text-muted-foreground max-w-sm">
          Manage your pots or start a new one with people you trust.
        </p>
        <div className="flex gap-3 mt-2">
          <Button
            size="lg"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white btn-glow border-0"
            onClick={() => setCreateOpen(true)}
          >
            + Create Pot
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300"
            onClick={() => setJoinOpen(true)}
          >
            Join Pot
          </Button>
        </div>
      </div>

      {/* Pool list */}
      <div className="px-8 max-w-xl mx-auto pb-16">
        {pools === undefined ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-violet-50/60 border border-violet-100/50 animate-pulse"
              />
            ))}
          </div>
        ) : pools.length === 0 ? (
          <Card className="border-violet-100/60">
            <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="36" fill="rgba(139,92,246,0.08)" />
                <rect
                  x="34"
                  y="16"
                  width="12"
                  height="4"
                  rx="2"
                  fill="rgba(139,92,246,0.55)"
                />
                <rect
                  x="20"
                  y="26"
                  width="40"
                  height="9"
                  rx="4.5"
                  fill="rgba(139,92,246,0.18)"
                  stroke="rgba(139,92,246,0.45)"
                  strokeWidth="1.5"
                />
                <path
                  d="M22 35 C21 50 22 63 40 63 C58 63 59 50 58 35 Z"
                  fill="rgba(139,92,246,0.1)"
                  stroke="rgba(139,92,246,0.4)"
                  strokeWidth="1.5"
                />
                <ellipse
                  cx="51"
                  cy="46"
                  rx="3.5"
                  ry="7"
                  fill="rgba(255,255,255,0.5)"
                  transform="rotate(-20 51 46)"
                />
                <path
                  d="M36 48 H44"
                  stroke="rgba(139,92,246,0.6)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M40 44 V52"
                  stroke="rgba(139,92,246,0.6)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-base">No pots yet</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  You're not a member of any pots. Create one or ask a manager
                  to add you.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {pools.map(({ pool, role }) => (
              <Card
                key={pool._id}
                className="cursor-pointer border-l-[3px] border-l-violet-400/70 hover:border-l-violet-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(139,92,246,0.18),0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-200 group"
                onClick={() => onSelectPool(pool._id)}
              >
                <CardContent className="flex items-center justify-between py-5 px-5">
                  <div className="flex items-center gap-4">
                    <div className="size-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-violet-200 group-hover:shadow-violet-300 transition-shadow">
                      {pool.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-base leading-tight">
                        {pool.name}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 capitalize">
                        <span className="size-1.5 rounded-full bg-violet-500" />
                        {pool.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={role === "manager" ? "default" : "secondary"}
                      className={
                        role === "manager"
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-0 text-white shadow-sm"
                          : "bg-white/80 text-slate-600 border-slate-200"
                      }
                    >
                      {role}
                    </Badge>
                    <span className="size-7 flex items-center justify-center rounded-full bg-violet-50 text-violet-500 group-hover:bg-violet-100 group-hover:text-violet-700 transition-all text-sm font-bold">
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
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_8px_40px_rgba(0,0,0,0.15)] w-full max-w-md mx-4 p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">
                  {joinPhase === "input" ? "Join a Pot" : "Enter Your Name"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {joinPhase === "input"
                    ? "Paste an invite link or enter a pot ID."
                    : "Choose a display name for this pot."}
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
                    setLookupPoolId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && joinInput.trim()) handleLookup();
                  }}
                  placeholder="Paste invite link or pot ID…"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  autoFocus
                />

                {inputError && (
                  <p className="text-sm text-red-600 -mt-2">{inputError}</p>
                )}
                {lookupNotFound && (
                  <p className="text-sm text-red-600 -mt-2">
                    Pot not found. Check the ID or invite link.
                  </p>
                )}

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
                      {isLooking ? "Looking up…" : "Look Up Pot"}
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
