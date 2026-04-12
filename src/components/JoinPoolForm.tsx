import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface JoinPoolFormProps {
  poolId: Id<"pools">;
  walletAddress: string;
  onSuccess: () => void;
}

export function JoinPoolForm({
  poolId,
  walletAddress,
  onSuccess,
}: JoinPoolFormProps) {
  const addMember = useMutation(api.members.addMember);

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await addMember({
        poolId,
        name: name.trim(),
        role: "member",
        wallet: walletAddress,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join pot.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <div className="flex flex-col gap-1">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="wallet-address"
        >
          Wallet address
        </label>
        <input
          id="wallet-address"
          type="text"
          value={walletAddress}
          readOnly
          className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 font-mono cursor-not-allowed"
        />
      </div>
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Joining…" : "Join Pot"}
      </button>
    </form>
  );
}
