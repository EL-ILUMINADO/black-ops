"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSecurityStore } from "@/store/useSecurityStore";

export default function VaultPinModal() {
  const [mode, setMode] = useState<"LOADING" | "SETUP" | "VERIFY">("LOADING");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { unlockChat, registerFailedAttempt, failedAttempts } = useSecurityStore();
  const supabase = createClient();

  // 1. PING THE DB ON LOAD TO DETERMINE OPERATIVE STATUS
  useEffect(() => {
    const checkExistingPin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("workspace_password")
        .eq("id", user.id)
        .single();

      // If a password exists, interrogate them. If not, force them to set one.
      if (data && data.workspace_password) {
        setMode("VERIFY");
      } else {
        setMode("SETUP");
      }
    };
    
    checkExistingPin();
  }, [supabase]);

  const handleAction = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    if (mode === "SETUP") {
      // --- SETUP PROTOCOL ---
      if (pin !== confirmPin) {
        setError("CIPHERS DO NOT MATCH.");
        setLoading(false);
        return;
      }
      if (pin.length < 4) {
        setError("CIPHER TOO WEAK. MINIMUM 4 CHARACTERS.");
        setLoading(false);
        return;
      }

      // Hash, store, AND force Supabase to return the row to prove it worked
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({ workspace_password: btoa(pin) }) 
        .eq("id", user.id)
        .select();

      // Catch silent RLS failures
      if (updateError || !updatedProfile || updatedProfile.length === 0) {
        setError("DATABASE REJECTED WRITE (CHECK RLS POLICIES).");
      } else {
        setMode("VERIFY");
        setPin("");
        setConfirmPin("");
        setSuccess("AUTHORITY ESTABLISHED. VERIFY TO UNLOCK.");
      }

    } else if (mode === "VERIFY") {
      // --- VERIFICATION PROTOCOL ---
      const { data } = await supabase
        .from("profiles")
        .select("workspace_password")
        .eq("id", user.id)
        .single();

      if (data && data.workspace_password === btoa(pin)) {
        unlockChat(); // Passwords match, grant access
      } else {
        // THE 3-STRIKE PUNISHMENT
        registerFailedAttempt();
        const attemptsLeft = 2 - failedAttempts; 
        
        if (attemptsLeft > 0) {
          setError(`AUTHORITY REJECTED. [ ${attemptsLeft} ATTEMPTS REMAINING ]`);
        } else {
          setError("MAXIMUM ATTEMPTS REACHED. PURGING MEMORY...");
        }
        
        setPin(""); // Purge the incorrect attempt
      }
    }
    
    setLoading(false);
  };

  if (mode === "LOADING") {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="w-8 h-8 border-t-2 border-neon-red rounded-full animate-spin"></div>
        <div className="text-neon-red animate-pulse text-[10px] font-code uppercase tracking-widest">
          Scanning Vault Authority...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <p className="text-[10px] font-code text-slate-500 uppercase">
          {mode === "SETUP" 
            ? "// INITIALIZE NEW WORKSPACE CIPHER" 
            : "// ENTER EXISTING WORKSPACE CIPHER"}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-neon-red/10 text-neon-red border border-neon-red/20 text-[10px] font-code uppercase text-center animate-in fade-in slide-in-from-top-2">
          ERR: {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 text-[10px] font-code uppercase text-center animate-in fade-in slide-in-from-top-2">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <input
          type="password"
          placeholder={mode === "SETUP" ? "CREATE NEW PASSWORD" : "ENTER PASSWORD"}
          className="w-full bg-obsidian border border-neutral-800 p-4 text-sm font-code text-white focus:border-neon-red focus:outline-none transition-all text-center tracking-widest"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAction()}
          autoFocus
        />
        
        {/* Only show the confirmation input if they are setting it up for the first time */}
        {mode === "SETUP" && (
          <input
            type="password"
            placeholder="CONFIRM NEW PASSWORD"
            className="w-full bg-obsidian border border-neutral-800 p-4 text-sm font-code text-white focus:border-neon-red focus:outline-none transition-all text-center tracking-widest"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAction()}
          />
        )}
      </div>

      <button 
        onClick={handleAction}
        disabled={loading || !pin || (mode === "SETUP" && !confirmPin)}
        className="w-full py-4 text-[10px] font-code bg-neon-red text-obsidian font-bold uppercase hover:bg-white transition-all disabled:opacity-30 tracking-widest"
      >
        {loading 
          ? "PROCESSING..." 
          : mode === "SETUP" ? "ESTABLISH AUTHORITY" : "UNLOCK WORKSPACE"}
      </button>
    </div>
  );
}