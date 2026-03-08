"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useInactivityTimer } from "@/hooks/useInactivityTimer";
import { useSecurityStore } from "@/store/useSecurityStore";
import MessageFeed from "@/components/MessageFeed";
import MessageInput from "@/components/MessageInput";
import VaultPinModal from "@/components/VaultPinModal";

export default function SecureRoomPage({ params }: { params: Promise<{ connectionId: string }> }) {
  const resolvedParams = use(params);
  const connectionId = resolvedParams.connectionId;
  const router = useRouter();
  
  // 1. SECURITY STATES
  const { isUnlocked } = useSecurityStore(); // Global lock state
  const [isDecrypted, setIsDecrypted] = useState(false); // Room-specific access
  const [localKey, setLocalKey] = useState("");
  const [sharedKey, setSharedKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [breachDetected, setBreachDetected] = useState(false);

  // 2. THE DEAD MAN'S SWITCH: Triggered after 20s of inactivity
  useInactivityTimer(20000);

  // 3. GLOBAL LOCK SYNC: If the workspace locks, nuke the local room state immediately
  useEffect(() => {
    if (!isUnlocked) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDecrypted(false);
      setLocalKey("");
      setSharedKey("");
      console.log("GLOBAL_LOCK_SYNCED: Local ciphers purged.");
    }
  }, [isUnlocked]);

  useEffect(() => {
    const supabase = createClient();

    // 4. THE BREACH RADAR: Listen for unauthorized handshakes while you are active
    const setupBreachListener = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('breach_radar')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'connections',
          filter: `recipient_id=eq.${user.id}`
        }, () => {
          setBreachDetected(true);
          setIsDecrypted(false); // Force lock the room
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    setupBreachListener();

    // Tab Switch Protection: Instant lock if operative looks away
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsDecrypted(false);
        setLocalKey("");
        setSharedKey("");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleDecryptionLogin = async () => {
    if (!localKey || !sharedKey) {
      setError("BOTH CIPHERS REQUIRED FOR ACCESS.");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Verify Local 24h Key Authority
    const { data: vaultKey } = await supabase
      .from("personal_vault_keys")
      .select("decryption_key_hash")
      .eq("connection_id", connectionId)
      .eq("user_id", user.id)
      .single();

    if (!vaultKey || btoa(localKey) !== vaultKey.decryption_key_hash) {
      setError("INVALID LOCAL DECRYPTION AUTHORITY.");
      setLoading(false);
      return;
    }

    // Verify Shared Channel Cipher
    const { data: conn } = await supabase
      .from("connections")
      .select("chat_password_hash")
      .eq("id", connectionId)
      .single();

    if (!conn || btoa(sharedKey) !== conn.chat_password_hash) {
      setError("INVALID SHARED CHAT CIPHER.");
      setLoading(false);
      return;
    }

    setIsDecrypted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-obsidian text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* LAYER 1: GLOBAL WORKSPACE LOCK (Highest Priority) */}
      {!isUnlocked ? (
        <div className="grow flex flex-col items-center justify-center space-y-8 z-[250] p-8 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 border-2 border-neon-red rounded-full flex items-center justify-center animate-pulse">
            <div className="w-4 h-5 border-2 border-neon-red rounded-t-full relative">
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-6 h-4 bg-neon-red rounded-sm -mt-0.5"></div>
            </div>
          </div>
          <h2 className="text-xl font-bold font-avant text-neon-red uppercase tracking-widest">
            Workspace Locked
          </h2>
          <VaultPinModal />
        </div>
      ) : (
        /* LAYER 2: ACTIVE SESSION UI */
        <>
          {/* BREACH NOTIFICATION OVERLAY */}
          {breachDetected && (
            <div className="fixed inset-0 z-[200] bg-neon-red/20 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-obsidian border-2 border-neon-red p-8 max-w-sm w-full text-center space-y-6 shadow-[0_0_50px_rgba(255,0,0,0.3)]">
                <div className="text-neon-red animate-pulse text-4xl font-bold font-avant uppercase tracking-tighter">
                  ! BREACH_DETECTED !
                </div>
                <p className="font-code text-[10px] text-slate-400 uppercase leading-relaxed">
                  {"// UNAUTHORIZED_HANDSHAKE_ATTEMPT_INTERCEPTED"}
                  <br />
                  {"// SYSTEM_LOCKED_FOR_PROTECTION"}
                </p>
                <button 
                  onClick={() => { setBreachDetected(false); router.push('/chat'); }}
                  className="w-full py-3 bg-neon-red text-obsidian font-bold font-code uppercase hover:bg-white transition-all"
                >
                  [ Return to Workspace ]
                </button>
              </div>
            </div>
          )}

          {!isDecrypted ? (
            /* LAYER 3: ROOM DECRYPTION INTERFACE */
            <div className="w-full max-w-md bg-matte border border-neon-cyan/30 p-8 shadow-[0_0_50px_rgba(0,255,255,0.05)]">
              <div className="text-center mb-8">
                <h1 className="text-xl font-bold font-avant text-neon-cyan tracking-widest uppercase">Secure Channel</h1>
                <p className="text-[10px] font-code text-slate-500 mt-2 uppercase text-neon-red">{"// DUAL_AUTHENTICATION_REQUIRED"}</p>
              </div>
              {error && <div className="p-3 mb-4 bg-neon-red/10 text-neon-red border border-neon-red/20 text-[10px] font-code uppercase">ERR: {error}</div>}
              <div className="space-y-4 mb-8">
                <input type="password" placeholder="1. SHARED CHAT PASSWORD" value={sharedKey} onChange={(e) => setSharedKey(e.target.value)} className="w-full bg-obsidian border border-neutral-800 p-4 text-sm font-code text-white focus:border-neon-cyan focus:outline-none transition-all" />
                <input type="password" placeholder="2. LOCAL 24H VAULT KEY" value={localKey} onChange={(e) => setLocalKey(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleDecryptionLogin()} className="w-full bg-obsidian border border-neutral-800 p-4 text-sm font-code text-white focus:border-neon-cyan focus:outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => router.push('/chat')} className="py-3 text-[10px] font-code text-neutral-600 uppercase tracking-widest border border-neutral-800 hover:bg-white/5 transition-all">[ Abort ]</button>
                <button onClick={handleDecryptionLogin} disabled={loading || !localKey || !sharedKey} className="py-3 text-[10px] font-code bg-neon-cyan text-obsidian font-bold uppercase hover:bg-white transition-all disabled:opacity-30">{loading ? "VERIFYING..." : "DECRYPT CHANNEL"}</button>
              </div>
            </div>
          ) : (
            /* LAYER 4: ACTIVE CHAT ROOM */
            <div className="w-full max-w-5xl h-[85vh] bg-matte border border-neutral-800 flex flex-col relative overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-800 bg-obsidian/50 flex justify-between items-center z-10">
                <div className="flex items-center gap-6">
                  <button onClick={() => router.push('/chat')} className="text-[9px] font-code text-neutral-500 hover:text-white uppercase transition-colors">[ &lt;- Return ]</button>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,255,0.5)]"></div>
                    <span className="text-xs font-code text-neon-cyan uppercase tracking-widest">LINK_ACTIVE // CONN: {connectionId.split('-')[0]}</span>
                  </div>
                </div>
              </div>
              <div className="grow flex flex-col overflow-hidden z-10">
                <MessageFeed connectionId={connectionId} />
                <div className="p-6 border-t border-neutral-800 bg-obsidian/50">
                  <MessageInput connectionId={connectionId} sharedEncryptKey={sharedKey} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tactical Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
    </div>
  );
}