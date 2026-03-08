"use client";

import { useState } from "react";
import { verifyReceiverIdentity, completeAcceptance } from "@/app/auth/actions";
import { useScrambler } from "@/hooks/useScrambler";

type AcceptStep = "VERIFY_LOGIN" | "CREATE_SHARED_PW" | "CREATE_DECRYPT_PW";

export default function AcceptRequestModal({ 
  isOpen, 
  onCloseAction, 
  request 
}: { 
  isOpen: boolean; 
  onCloseAction: () => void;
  request: { id: string; senderEmail: string } | null;
}) {
  const [step, setStep] = useState<AcceptStep>("VERIFY_LOGIN");
  const [loginPw, setLoginPw] = useState("");
  const [sharedPw, setSharedPw] = useState("");
  const [decryptPw, setDecryptPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const senderGhostId = useScrambler(request?.senderEmail);

  if (!isOpen || !request) return null;

  const handleVerify = async () => {
    setError(null); setLoading(true);
    try {
      await verifyReceiverIdentity(loginPw);
      setStep("CREATE_SHARED_PW");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An unexpected intercept occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    setError(null); setLoading(true);
    try {
      await completeAcceptance(request.id, sharedPw, decryptPw);
      onCloseAction(); // Handshake complete, close modal
      // Optionally trigger a state update to move them to the messages tab
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An unexpected intercept occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-obsidian/95 backdrop-blur-md p-6">
      <div className="w-full max-w-lg bg-matte border border-neon-cyan/30 p-8 shadow-[0_0_50px_rgba(0,255,255,0.1)] relative overflow-hidden">
        
        {/* STEP 1: VERIFY LOGIN */}
        {step === "VERIFY_LOGIN" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center">
              <h2 className="text-xl font-bold font-avant text-neon-cyan tracking-widest uppercase">Incoming Signal</h2>
              <p className="text-[10px] font-code text-slate-500 mt-2 uppercase">
                {senderGhostId} is requesting a secure channel.
              </p>
            </div>
            {error && <div className="p-3 bg-neon-red/10 text-neon-red text-[10px] font-code uppercase">ERR: {error}</div>}
            <input
              type="password"
              placeholder="VERIFY YOUR LOGIN PASSPHRASE"
              className="w-full bg-obsidian border border-neutral-800 p-4 text-sm font-code text-white focus:border-neon-cyan focus:outline-none"
              value={loginPw}
              onChange={(e) => setLoginPw(e.target.value)}
            />
            <button 
              onClick={handleVerify} disabled={loading || !loginPw}
              className="w-full py-3 text-[10px] font-code bg-neon-cyan text-obsidian font-bold uppercase hover:bg-white transition-all disabled:opacity-30"
            >
              {loading ? "VERIFYING..." : "PROCEED TO SECURE LINK"}
            </button>
          </div>
        )}

        {/* STEP 2: SHARED CHAT PASSWORD */}
        {step === "CREATE_SHARED_PW" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center">
              <h2 className="text-xl font-bold font-avant text-neon-cyan tracking-widest uppercase">Channel Cipher</h2>
              <p className="text-[10px] font-code text-slate-500 mt-2 uppercase text-neon-red">
                WARNING: This unlock password will be shared with {senderGhostId}.
              </p>
            </div>
            <input
              type="text"
              placeholder="CREATE SHARED CHAT PASSWORD"
              className="w-full bg-obsidian border border-neutral-800 p-4 text-sm font-code text-white focus:border-neon-red focus:outline-none"
              value={sharedPw}
              onChange={(e) => setSharedPw(e.target.value)}
            />
            <button 
              onClick={() => setStep("CREATE_DECRYPT_PW")} disabled={!sharedPw}
              className="w-full py-3 text-[10px] font-code bg-neon-cyan text-obsidian font-bold uppercase hover:bg-white transition-all disabled:opacity-30"
            >
              SAVE & CONTINUE
            </button>
          </div>
        )}

        {/* STEP 3: LOCAL DECRYPTION PASSWORD */}
        {step === "CREATE_DECRYPT_PW" && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="text-center">
              <h2 className="text-xl font-bold font-avant text-neon-cyan tracking-widest uppercase">Local Vault Key</h2>
              <p className="text-[10px] font-code text-slate-500 mt-2 uppercase">
                Create a decryption password for this chat. (Expires in 24h).
              </p>
            </div>
            {error && <div className="p-3 bg-neon-red/10 text-neon-red text-[10px] font-code uppercase">ERR: {error}</div>}
            <input
              type="password"
              placeholder="CREATE LOCAL DECRYPTION PASSWORD"
              className="w-full bg-obsidian border border-neutral-800 p-4 text-sm font-code text-white focus:border-neon-cyan focus:outline-none"
              value={decryptPw}
              onChange={(e) => setDecryptPw(e.target.value)}
            />
            <button 
              onClick={handleFinalize} disabled={loading || !decryptPw}
              className="w-full py-3 text-[10px] font-code bg-white text-obsidian font-bold uppercase hover:bg-neon-cyan transition-all disabled:opacity-30"
            >
              {loading ? "ESTABLISHING..." : "FINALIZE SECURE LINK"}
            </button>
          </div>
        )}

        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-neon-cyan/50 to-transparent"></div>
      </div>
    </div>
  );
}