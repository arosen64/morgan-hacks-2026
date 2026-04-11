import { useState } from "react";
import { useWallet } from "../hooks/useWallet";

interface Props {
  children: React.ReactNode;
}

export function WalletGate({ children }: Props) {
  const {
    publicKey,
    balance,
    airdropWarning,
    isLoading,
    createDemoWallet,
    logout,
  } = useWallet();

  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // Logged in — render the app
  if (publicKey) {
    const truncated = `${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}`;
    return (
      <div>
        <div style={styles.topBar}>
          <span style={styles.walletInfo}>
            {truncated}
            {balance !== null && (
              <span style={styles.balance}> · {balance.toFixed(4)} SOL</span>
            )}
          </span>
          <button style={styles.logoutBtn} onClick={logout}>
            Log Out
          </button>
        </div>
        {airdropWarning && <div style={styles.warning}>{airdropWarning}</div>}
        {children}
      </div>
    );
  }

  // Not logged in — show wallet selection
  async function handleDemoSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameError("Username is required");
      return;
    }
    setUsernameError("");
    await createDemoWallet(trimmed);
  }

  return (
    <div style={styles.gate}>
      <div style={styles.card}>
        <h1 style={styles.title}>Group Treasury</h1>
        <p style={styles.subtitle}>
          A trustless on-chain treasury for your group.
        </p>

        <div style={styles.options}>
          {/* Phantom / wallet adapter — placeholder for wallet adapter integration */}
          <div style={styles.optionBlock}>
            <h2 style={styles.optionTitle}>Connect Wallet</h2>
            <p style={styles.optionDesc}>
              Use Phantom or another Solana wallet.
            </p>
            <button
              style={{ ...styles.btn, ...styles.btnPhantom }}
              disabled
              title="Phantom integration coming soon"
            >
              Connect Phantom
            </button>
          </div>

          <div style={styles.divider}>or</div>

          {/* Demo wallet */}
          <div style={styles.optionBlock}>
            <h2 style={styles.optionTitle}>Try Demo</h2>
            <p style={styles.optionDesc}>
              Enter a username to get an instant devnet wallet with 2 SOL.
            </p>
            <form onSubmit={handleDemoSubmit} style={styles.form}>
              <input
                style={styles.input}
                type="text"
                placeholder="Username (e.g. alice)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={50}
                disabled={isLoading}
              />
              {usernameError && (
                <span style={styles.error}>{usernameError}</span>
              )}
              <button
                style={{ ...styles.btn, ...styles.btnDemo }}
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Setting up wallet…" : "Get Wallet"}
              </button>
            </form>
            {airdropWarning && (
              <div style={styles.warning}>{airdropWarning}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  gate: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
    fontFamily: "sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "2.5rem",
    maxWidth: 480,
    width: "100%",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  title: { margin: "0 0 0.25rem", fontSize: "1.75rem", fontWeight: 700 },
  subtitle: { color: "#666", margin: "0 0 2rem", fontSize: "0.95rem" },
  options: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  optionBlock: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  optionTitle: { margin: 0, fontSize: "1rem", fontWeight: 600 },
  optionDesc: { margin: 0, color: "#666", fontSize: "0.875rem" },
  divider: {
    textAlign: "center",
    color: "#aaa",
    fontSize: "0.85rem",
    margin: "0.25rem 0",
  },
  form: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  input: {
    padding: "0.6rem 0.75rem",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: "0.95rem",
    outline: "none",
  },
  btn: {
    padding: "0.65rem 1rem",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  btnPhantom: { background: "#ab9ff2", color: "#fff" },
  btnDemo: { background: "#111", color: "#fff" },
  error: { color: "#c0392b", fontSize: "0.8rem" },
  warning: {
    background: "#fff8e1",
    border: "1px solid #ffe082",
    borderRadius: 6,
    padding: "0.5rem 0.75rem",
    fontSize: "0.8rem",
    color: "#795548",
    marginTop: "0.5rem",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.5rem 1rem",
    borderBottom: "1px solid #eee",
    background: "#fff",
    fontFamily: "sans-serif",
    fontSize: "0.875rem",
  },
  walletInfo: { color: "#444", fontFamily: "monospace" },
  balance: { color: "#888" },
  logoutBtn: {
    background: "none",
    border: "1px solid #ddd",
    borderRadius: 6,
    padding: "0.3rem 0.75rem",
    cursor: "pointer",
    fontSize: "0.8rem",
    color: "#555",
  },
};
