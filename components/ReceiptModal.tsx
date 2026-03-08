"use client";

import { useState } from "react";
import { fetchSharedKey, finalizeSenderKey } from "@/app/auth/actions";
import { useScrambler } from "@/hooks/useScrambler";

type ReceiptStep = "VERIFY_LOGIN" | "VIEW_SHARED_PW" | "CREATE_DECRYPT_PW";

export default function ReceiptModal({ 
  isOpen, 
  onCloseAction, 
  request 
}: { 
  isOpen: boolean; 
  onCloseAction: () => void;
  request: { id: string; targetEmail: string } | null;
}) {
  const [step, setStep] = useState<ReceiptStep>("VERIFY_LOGIN");
  const [loginPw, setLoginPw] = useState("");
  const [sharedPw, setSharedPw] = useState("");
  const [decryptPw, setDecryptPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetGhostId = useScrambler(request?.targetEmail);

  if (!isOpen || !request) return null;

  const handleVerify = async () => {
    setError(null); setLoading(true);
    try {
      const { sharedPassword } = await fetchSharedKey(request.id, loginPw);
      setSharedPw(sharedPassword);
      setStep("VIEW_SHARED_PW");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An unexpected intercept occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    setError(null); setLoading(true);
    try {
      await finalizeSenderKey(request.id, decryptPw);
      onCloseAction(); // Handshake completely finished!
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
              <h2 className="text-xl font-bold font-avant text-neon-cyan tracking-widest uppercase">Link Accepted</h2>
              <p className="text-[10px] font-code text-slate-500 mt-2 uppercase leading-relaxed">
                {targetGhostId} has accepted your request. Verify identity to retrieve the shared channel cipher.
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
              {loading ? "DECRYPTING CIPHER..." : "RETRIEVE CHAT PASSWORD"}
            </button>
          </div>
        )}

        {/* STEP 2: VIEW SHARED PASSWORD */}
        {step === "VIEW_SHARED_PW" && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="text-center">
              <h2 className="text-xl font-bold font-avant text-neon-cyan tracking-widest uppercase">Channel Cipher</h2>
              <p className="text-[10px] font-code text-slate-500 mt-2 uppercase">
                {targetGhostId} has set the following shared password for this secure line.
              </p>
            </div>
            <div className="p-6 bg-obsidian border border-neon-cyan/50 text-center select-all">
              <p className="text-xl font-code text-neon-cyan tracking-[0.2em]">{sharedPw}</p>
            </div>
            <button 
              onClick={() => setStep("CREATE_DECRYPT_PW")}
              className="w-full py-3 text-[10px] font-code border border-neon-cyan text-neon-cyan font-bold uppercase hover:bg-neon-cyan/10 transition-all"
            >
              ACKNOWLEDGE & CONTINUE
            </button>
          </div>
        )}

        {/* STEP 3: CREATE DECRYPTION PASSWORD */}
        {step === "CREATE_DECRYPT_PW" && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="text-center">
              <h2 className="text-xl font-bold font-avant text-neon-cyan tracking-widest uppercase">Local Vault Key</h2>
              <p className="text-[10px] font-code text-slate-500 mt-2 uppercase">
                Create your local decryption password for this chat. (Expires in 24h).
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
              {loading ? "FINALIZING..." : "FINALIZE SECURE LINK"}
            </button>
          </div>
        )}

        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-neon-cyan/50 to-transparent"></div>
      </div>
    </div>
  );
}