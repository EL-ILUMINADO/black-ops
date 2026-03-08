"use client";

import { useState, useTransition } from "react";
import { verifyAndSignOut } from "@/app/auth/actions";

export default function LogoutModal({ isOpen, onCloseAction }: { isOpen: boolean; onCloseAction: () => void }) {
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleTerminate = () => {
    setError("");
    if (pass1 !== pass2) {
      setError("Passphrases do not match.");
      return;
    }

    startTransition(async () => {
      try {
        await verifyAndSignOut(pass1);
      } catch (error: unknown) {
        setError((error as Error).message || "Termination failed.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-obsidian/90 backdrop-blur-xl p-6">
      <div className="w-full max-w-md bg-matte border border-neon-red/30 p-8 shadow-[0_0_50px_rgba(255,0,0,0.1)]">
        
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold font-avant text-neon-red tracking-[0.2em] uppercase">
            Confirm Incineration
          </h2>
          <p className="text-[10px] font-code text-slate-500 mt-2 uppercase">
            {"// SESSION_DESTRUCTION_PROTOCOL"}
          </p>
        </div>

        {error && (
          <p className="mb-6 text-[10px] font-code text-neon-red bg-neon-red/10 p-2 border border-neon-red/20 uppercase">
            ERR: {error}
          </p>
        )}

        <div className="space-y-4">
          <input
            type="password"
            placeholder="VERIFY PASSPHRASE"
            className="w-full bg-obsidian border border-neutral-800 p-3 text-sm font-code text-white focus:border-neon-red focus:outline-none transition-all"
            value={pass1}
            onChange={(e) => setPass1(e.target.value)}
          />
          <input
            type="password"
            placeholder="CONFIRM PASSPHRASE"
            className="w-full bg-obsidian border border-neutral-800 p-3 text-sm font-code text-white focus:border-neon-red focus:outline-none transition-all"
            value={pass2}
            onChange={(e) => setPass2(e.target.value)}
          />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            onClick={onCloseAction}
            disabled={isPending}
            className="py-3 text-[10px] font-code text-slate-500 uppercase tracking-widest border border-neutral-800 hover:bg-white/5 transition-all"
          >
            [ Abort ]
          </button>
          <button
            onClick={handleTerminate}
            disabled={isPending || !pass1 || !pass2}
            className="py-3 text-[10px] font-code bg-neon-red text-obsidian font-bold uppercase tracking-widest hover:bg-white transition-all disabled:opacity-30"
          >
            {isPending ? "INCINERATING..." : "CONFIRM WIPE"}
          </button>
        </div>
        
        {isPending && (
          <div className="mt-6 flex justify-center">
            <div className="w-12 h-1 bg-neutral-900 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-neon-red animate-[progress_2s_infinite] w-1/2"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}