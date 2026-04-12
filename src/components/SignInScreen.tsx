import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import heroImage from "@/assets/hero.png";

interface SignInScreenProps {
  signingState?: "signing" | "error";
  errorMessage?: string;
  onRetry?: () => void;
}

export function SignInScreen({
  signingState,
  errorMessage,
  onRetry,
}: SignInScreenProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-950 p-12 text-white">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-violet-500" />
          <span className="text-lg font-semibold tracking-tight">Potlock</span>
        </div>

        <div className="flex flex-col items-center gap-8">
          <img src={heroImage} alt="Potlock" className="w-64 drop-shadow-2xl" />
          <blockquote className="text-center">
            <p className="text-xl font-medium leading-snug">
              "The smarter way to manage money
              <br />
              with people you trust."
            </p>
          </blockquote>
        </div>

        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} Potlock. All rights reserved.
        </p>
      </div>

      {/* Right panel — sign in */}
      <div className="flex flex-col items-center justify-center gap-8 p-8 bg-background">
        {/* Mobile logo */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="size-7 rounded-lg bg-violet-500" />
          <span className="text-lg font-semibold tracking-tight">Potlock</span>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              {signingState === "signing"
                ? "Check your Phantom wallet to approve the sign-in request."
                : "Connect your Phantom wallet to access your pots."}
            </p>
          </div>

          {signingState === "error" && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive text-center">
              {errorMessage ?? "Authentication failed."}
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="ml-2 underline underline-offset-2 hover:no-underline"
                >
                  Try again
                </button>
              )}
            </div>
          )}

          <div className="flex justify-center">
            {signingState === "signing" ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                Waiting for signature…
              </div>
            ) : (
              <WalletMultiButton />
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By connecting, you agree to our{" "}
            <span className="underline underline-offset-4 cursor-pointer hover:text-foreground transition-colors">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="underline underline-offset-4 cursor-pointer hover:text-foreground transition-colors">
              Privacy Policy
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
