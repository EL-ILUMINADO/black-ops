/* eslint-disable react/jsx-no-comment-textnodes */
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isSecureZone = pathname.startsWith("/chat");
  
  // Verification Modal State
  const [isVerifying, setIsVerifying] = useState(false);
  const [mode, setMode] = useState<"LOGOUT" | "GLOBAL_KILL">("LOGOUT");
  const [passOne, setPassOne] = useState("");
  const [passTwo, setPassTwo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetVerification = () => {
    setIsVerifying(false);
    setPassOne("");
    setPassTwo("");
    setError("");
    setLoading(false);
  };

  const executeTermination = async () => {
    if (passOne !== passTwo) {
      setError("CIPHERS DO NOT MATCH.");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Verify password against Supabase Auth
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: passOne,
    });

    if (authError) {
      setError("AUTHORITY REJECTED: INVALID CREDENTIALS.");
      setLoading(false);
      return;
    }

    // 2. If Global Kill, vaporize all keys
    if (mode === "GLOBAL_KILL") {
      await supabase
        .from("personal_vault_keys")
        .delete()
        .eq("user_id", user.id);
    }

    // 3. Final Sign Out
    await supabase.auth.signOut();
    resetVerification();
    router.push("/");
  };

  return (
    <>
      <nav className="sticky top-0 w-full border-b border-neutral-800 bg-obsidian/95 backdrop-blur-md px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,255,0.5)]"></div>
          <Link href={isSecureZone ? "/chat" : "/"} className="text-xl font-bold font-avant text-white tracking-widest uppercase hover:text-neon-cyan transition-colors">
            Cipher Drop {isSecureZone && <span className="text-[10px] text-neutral-600 ml-2">// WORKSPACE</span>}
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isSecureZone ? (
            <>
              {/* Global Kill Switch */}
              <button 
                onClick={() => { setMode("GLOBAL_KILL"); setIsVerifying(true); }}
                className="px-4 py-2 border border-neon-red text-[9px] font-code text-neon-red hover:bg-neon-red hover:text-obsidian font-bold transition-all uppercase tracking-widest"
              >
                [ Global Kill ]
              </button>
              
              {/* Standard Logout */}
              <button 
                onClick={() => { setMode("LOGOUT"); setIsVerifying(true); }}
                className="px-4 py-2 border border-neutral-700 text-[9px] font-code text-slate-400 hover:text-white hover:border-white transition-colors uppercase tracking-widest"
              >
                [ Terminate Session ]
              </button>
            </>
          ) : (
            <button 
              onClick={() => router.push("/auth")}
              className="px-6 py-2 border border-neon-cyan text-[10px] font-code text-neon-cyan hover:bg-neon-cyan hover:text-obsidian font-bold transition-all uppercase tracking-widest"
            >
              Initiate
            </button>
          )}
        </div>
      </nav>

      {/* HOSTILE VERIFICATION MODAL */}
      {isVerifying && (
        <div className="fixed inset-0 z-[100] bg-obsidian/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
          <div className="w-full max-w-md bg-matte border border-neon-red/30 p-8 shadow-[0_0_50px_rgba(255,0,0,0.1)]">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold font-avant text-neon-red uppercase tracking-widest">
                {mode === "GLOBAL_KILL" ? "SCORCHED EARTH PROTOCOL" : "CONFIRM TERMINATION"}
              </h2>
              <p className="text-[10px] font-code text-slate-500 mt-2 uppercase">
                {mode === "GLOBAL_KILL" 
                  ? "// ALL LOCAL VAULT KEYS WILL BE PERMANENTLY VAPORIZED" 
                  : "// END ACTIVE WORKSPACE SESSION"}
              </p>
            </div>

            {error && <div className="p-3 mb-6 bg-neon-red/10 text-neon-red border border-neon-red/20 text-[10px] font-code uppercase">ERR: {error}</div>}

            <div className="space-y-4 mb-8">
              <input
                type="password"
                placeholder="ENTER PRIMARY CIPHER"
                className="w-full bg-obsidian border border-neutral-800 p-4 text-sm font-code text-white focus:border-neon-red focus:outline-none transition-all"
                value={passOne}
                onChange={(e) => setPassOne(e.target.value)}
              />
              <input
                type="password"
                placeholder="RE-ENTER PRIMARY CIPHER"
                className="w-full bg-obsidian border border-neutral-800 p-4 text-sm font-code text-white focus:border-neon-red focus:outline-none transition-all"
                value={passTwo}
                onChange={(e) => setPassTwo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && executeTermination()}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={resetVerification}
                className="py-3 text-[10px] font-code text-neutral-600 uppercase tracking-widest border border-neutral-800 hover:bg-white/5 transition-all"
              >
                [ Abort ]
              </button>
              <button 
                onClick={executeTermination}
                disabled={loading || !passOne || !passTwo}
                className="py-3 text-[10px] font-code bg-neon-red text-obsidian font-bold uppercase hover:bg-white transition-all disabled:opacity-30"
              >
                {loading ? "VERIFYING..." : "[ EXECUTE ]"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}