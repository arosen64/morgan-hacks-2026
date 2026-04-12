import { useQuery } from "convex/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MainMenuProps {
  walletAddress: string;
  onSelectPool: (poolId: Id<"pools">) => void;
}

export function MainMenu({
  onSelectPool,
}: Omit<MainMenuProps, "walletAddress">) {
  const { disconnect } = useWallet();
  const pools = useQuery(api.members.getPoolsByWallet, {});

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
            disabled
          >
            + Create Pool
          </Button>
          <Button size="lg" variant="outline" disabled>
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
    </div>
  );
}
