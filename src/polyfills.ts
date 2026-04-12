import { Buffer } from "buffer";

// Make Buffer available globally for @solana/web3.js and other Node-style libs.
// This must be the first import in main.tsx so it runs before any Solana module
// initialization code in the bundle.
if (typeof globalThis.Buffer === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Buffer = Buffer;
}
