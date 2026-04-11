import { WalletGate } from "./components/WalletGate";

function App() {
  return (
    <WalletGate>
      <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <h2>Treasury Dashboard</h2>
        <p>Wallet connected. Treasury features coming soon.</p>
      </div>
    </WalletGate>
  );
}

export default App;
