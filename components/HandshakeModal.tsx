"use client";

import { useState } from "react";
import { verifyAndInitiateHandshake } from "@/app/auth/actions";

type HandshakeStep = 
  | "VERIFY_LOGIN"    // Person A/B must enter login password
  | "REQUEST_SENT"   // Person A is waiting
  | "CREATE_CHAT_PW" // Person B creating the shared key
  | "CREATE_DECRYPT" // Both creating their 24h keys
  | "LINK_ACTIVE";   // Handshake complete

interface HandshakeModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  targetAgent: { id: string; email: string } | null;
}

export default function HandshakeModal({ 
  isOpen, 
  onCloseAction, 
  targetAgent 
}: HandshakeModalProps) {
  const [step, setStep] = useState<HandshakeStep>("VERIFY_LOGIN");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !targetAgent) return null;

  const handleVerifyIdentity = async () => {
    setError(null);
    setLoading(true);

    try {
      await verifyAndInitiateHandshake(password, targetAgent.id);
      setStep("REQUEST_SENT");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error sending request"); 
    } finally {
      setLoading(false);
      setPassword(""); 
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-obsidian/95 backdrop-blur-md p-6">
      <div className="w-full max-w-lg bg-matte border border-neon-cyan/30 p-8 shadow-[0_0_50px_rgba(0,255,255,0.1)] relative overflow-hidden">
        
        {/* STEP 1: INITIAL VERIFICATION (PERSON A) */}
        {step === "VERIFY_LOGIN" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <h2 className="text-xl font-bold font-avant text-neon-cyan tracking-widest uppercase">
                Identity Challenge
              </h2>
              <p className="text-[10px] font-code text-slate-500 mt-2 uppercase">
                {"// VERIFY_LOGIN_PASSPHRASE_TO_PROCEED"}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-neon-red/10 border border-neon-red/20 text-neon-red text-[10px] font-code uppercase">
                ERR: {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] font-code text-neutral-500 uppercase tracking-widest">
                Master Passphrase
              </label>
              <input
                type="password"
                placeholder="ENTER LOGIN PASSPHRASE"
                className="w-full bg-obsidian border border-neutral-800 p-4 text-sm font-code text-white focus:border-neon-cyan focus:outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyIdentity()}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={onCloseAction} 
                className="py-3 text-[10px] font-code text-neutral-600 uppercase tracking-widest border border-neutral-800 hover:bg-white/5 transition-all"
              >
                [ Abort ]
              </button>
              <button 
                onClick={handleVerifyIdentity}
                disabled={loading || !password}
                className="py-3 text-[10px] font-code bg-neon-cyan text-obsidian font-bold uppercase tracking-widest hover:bg-white transition-all disabled:opacity-30"
              >
                {loading ? "VERIFYING..." : "CONFIRM IDENTITY"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: WAITING SCREEN (PERSON A) */}
        {step === "REQUEST_SENT" && (
          <div className="space-y-8 py-10 text-center animate-in zoom-in duration-500">
            <div className="w-16 h-16 mx-auto border border-neon-cyan/20 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-neon-cyan rounded-full animate-ping"></div>
            </div>
            <div>
              <p className="text-sm font-code text-neon-cyan uppercase tracking-[0.2em]">
                Handshake Initialized
              </p>
              <p className="text-[10px] font-code text-slate-500 mt-4 uppercase leading-relaxed">
                Waiting for Agent_Redacted to verify their own identity and establish a decryption frequency...
              </p>
            </div>
            <button 
              onClick={onCloseAction}
              className="px-6 py-2 border border-neutral-800 text-[9px] font-code text-neutral-600 hover:text-white uppercase transition-all"
            >
              [ Return to Workspace ]
            </button>
          </div>
        )}

        {/* Tactical Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-neon-cyan/50 to-transparent"></div>
      </div>
    </div>
  );
}