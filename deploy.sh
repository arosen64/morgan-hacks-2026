#!/usr/bin/env bash
# Run this script once the playground wallet (ARYRLhdPcxMqEz7wwn7xMoeL1pdf4pBarnWWxXeDS2d7)
# has been funded via https://faucet.solana.com
#
# Usage: ./deploy.sh

set -e
export PATH="$HOME/.cargo/bin:$HOME/.avm/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

KEYPAIR="playground-keypair.json"
PUBKEY=$(solana-keygen pubkey $KEYPAIR)
echo "Deploying with keypair: $PUBKEY"

# Check balance
BALANCE=$(solana balance $PUBKEY --url devnet | awk '{print $1}')
echo "Balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
  echo "ERROR: Insufficient balance. Fund $PUBKEY at https://faucet.solana.com then re-run."
  exit 1
fi

echo "Building..."
anchor build

echo "Deploying to devnet..."
anchor deploy --provider.cluster devnet --provider.wallet $KEYPAIR

# Extract the deployed program ID
PROGRAM_ID=$(anchor keys list 2>/dev/null | grep treasury | awk '{print $2}' || \
  solana address --keypair target/deploy/treasury-keypair.json)
echo "Deployed Program ID: $PROGRAM_ID"

# Update Anchor.toml with real program ID
sed -i '' "s/Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS/$PROGRAM_ID/g" Anchor.toml

# Update declare_id! in lib.rs
sed -i '' "s/Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS/$PROGRAM_ID/g" programs/treasury/src/lib.rs

# Copy IDL to frontend
mkdir -p src/idl
cp target/idl/treasury.json src/idl/treasury.json
echo "IDL copied to src/idl/treasury.json"

# Write VITE_PROGRAM_ID to .env.local
if grep -q "VITE_PROGRAM_ID" .env.local 2>/dev/null; then
  sed -i '' "s/VITE_PROGRAM_ID=.*/VITE_PROGRAM_ID=$PROGRAM_ID/" .env.local
else
  echo "VITE_PROGRAM_ID=$PROGRAM_ID" >> .env.local
fi
echo "VITE_PROGRAM_ID written to .env.local"

echo ""
echo "Deploy complete!"
echo "Program ID: $PROGRAM_ID"
echo "Next: rebuild with anchor build to embed the real program ID, then npm run build"
