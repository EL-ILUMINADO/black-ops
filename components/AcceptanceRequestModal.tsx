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

  const handleSharedPwSubmit = () => {
    setError(null);
    
    if (sharedPw.length < 10) {
      setError("CIPHER TOO WEAK. MINIMUM 10 CHARACTERS REQUIRED.");
      return;
    }
    
    if (/\s/.test(sharedPw)) {
      setError("INVALID FORMAT. SPACES ARE STRICTLY PROHIBITED.");
      return;
    }

    setStep("CREATE_DECRYPT_PW");
  };

  // --- STRICT VALIDATION FOR FINAL DECRYPTION KEY ---
  const handleFinalize = async () => {
    setError(null); 

    if (decryptPw.length < 10) {
      setError("VAULT KEY TOO WEAK. MINIMUM 10 CHARACTERS REQUIRED.");
      return;
    }
    
    if (/\s/.test(decryptPw)) {
      setError("INVALID FORMAT. SPACES ARE STRICTLY PROHIBITED.");
      return;
    }

    setLoading(true);
    try {
      await completeAcceptance(request.id, sharedPw, decryptPw);
      onCloseAction(); // Handshake complete, close modal
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An unexpected intercept occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-obsidian/95 backdrop-blur-md p-6">
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
            {error && <div className="p-3 bg-neon-red/10 text-neon-red text-[10px] font-code uppercase animate-in fade-in slide-in-from-top-2">ERR: {error}</div>}
            <input
              type="password"
              placeholder="VERIFY YOUR LOGIN PASSPHRASE"
              className="w-full bg-obsidian border border-neutral-800 p-4 text-sm font-code text-white focus:border-neon-cyan focus:outline-none"
              value={loginPw}
              onChange={(e) => {
                setLoginPw(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && loginPw && handleVerify()}
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
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="text-center">
              <h2 className="text-xl font-bold font-avant text-neon-cyan tracking-widest uppercase">Channel Cipher</h2>
              <p className="text-[10px] font-code text-slate-500 mt-2 uppercase text-neon-red">
                WARNING: This unlock password will be shared with {senderGhostId}.
              </p>
            </div>
            
            {error && <div className="p-3 bg-neon-red/10 text-neon-red border border-neon-red/20 text-[10px] font-code uppercase animate-in fade-in slide-in-from-top-2">ERR: {error}</div>}
            
            <div className="space-y-2">
              <input
                type="text"
                placeholder="CREATE SHARED CHAT PASSWORD"
                className={`w-full bg-obsidian border p-4 text-sm font-code text-white focus:outline-none transition-all ${
                  sharedPw.length >= 10 ? 'border-neon-cyan focus:border-neon-cyan' : 'border-neutral-800 focus:border-neon-red'
                }`}
                value={sharedPw}
                onChange={(e) => {
                  const sanitizedInput = e.target.value.replace(/\s/g, "");
                  setSharedPw(sanitizedInput);
                  if (error) setError(null); 
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSharedPwSubmit()}
              />
              <div className="flex justify-between items-center text-[9px] font-code uppercase px-1">
                <span className={`${sharedPw.length >= 10 ? 'text-neon-cyan' : 'text-neutral-500'} transition-colors`}>
                  Strength: {sharedPw.length}/10
                </span>
                <span className="text-neutral-600">NO_SPACES_PERMITTED</span>
              </div>
            </div>

            <button 
              onClick={handleSharedPwSubmit} 
              disabled={!sharedPw}
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
            
            {error && <div className="p-3 bg-neon-red/10 text-neon-red border border-neon-red/20 text-[10px] font-code uppercase animate-in fade-in slide-in-from-top-2">ERR: {error}</div>}
            
            <div className="space-y-2">
              {/* Type is "password" to mask the input, unlike the shared key which they need to see to share securely */}
              <input
                type="password"
                placeholder="CREATE LOCAL DECRYPTION PASSWORD"
                className={`w-full bg-obsidian border p-4 text-sm font-code text-white focus:outline-none transition-all ${
                  decryptPw.length >= 10 ? 'border-neon-cyan focus:border-neon-cyan' : 'border-neutral-800 focus:border-neon-red'
                }`}
                value={decryptPw}
                onChange={(e) => {
                  const sanitizedInput = e.target.value.replace(/\s/g, "");
                  setDecryptPw(sanitizedInput);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && decryptPw && handleFinalize()}
              />
              <div className="flex justify-between items-center text-[9px] font-code uppercase px-1">
                <span className={`${decryptPw.length >= 10 ? 'text-neon-cyan' : 'text-neutral-500'} transition-colors`}>
                  Strength: {decryptPw.length}/10
                </span>
                <span className="text-neutral-600">NO_SPACES_PERMITTED</span>
              </div>
            </div>

            <button 
              onClick={handleFinalize} disabled={loading || !decryptPw}
              className="w-full py-3 text-[10px] font-code bg-white text-obsidian font-bold uppercase hover:bg-neon-cyan transition-all disabled:opacity-30"
            >
              {loading ? "ESTABLISHING..." : "FINALIZE SECURE LINK"}
            </button>
          </div>
        )}

        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent"></div>
      </div>
    </div>
  );
}