import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface JoinPoolFormProps {
  poolId: Id<"pools">;
  onSuccess: () => void;
}

export function JoinPoolForm({ poolId, onSuccess }: JoinPoolFormProps) {
  const { publicKey, connected } = useWallet();
  const addMember = useMutation(api.members.addMember);

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 3.4 — Prompt to connect wallet if none connected
  if (!connected || !publicKey) {
    return (
      <div className="rounded-lg border border-gray-200 p-6 flex flex-col items-center gap-3">
        <p className="text-gray-600 text-sm">
          Connect your wallet to join this pool.
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  const wallet = publicKey.toBase58();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await addMember({ poolId, name: name.trim(), wallet, role: "member" });
      onSuccess(); // 3.5 — trigger redirect / parent callback on success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join pool.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <div className="flex flex-col gap-1">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="member-name"
        >
          Your name
        </label>
        <input
          id="member-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alice"
          required
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Wallet address
        </label>
        <input
          type="text"
          value={wallet}
          readOnly
          className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
        />
      </div>

      {/* 3.3 — Inline validation error */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Joining…" : "Join Pool"}
      </button>
    </form>
  );
}
