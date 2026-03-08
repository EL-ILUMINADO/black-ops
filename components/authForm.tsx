"use client";

import { useState, useTransition } from "react";
import { login, signup } from "@/app/auth/actions";
import Link from "next/link";

export default function AuthForm({ errorMessage }: { errorMessage?: string }) {
  const [isLogin, setIsLogin] = useState(true);
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  // Security Protocols (Regex)
  const securityChecks = {
    length: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password), 
  };

  const isPasswordValid = Object.values(securityChecks).every(Boolean);

  const handleSubmit = (formData: FormData) => {
    startTransition(() => {
      if (isLogin) {
        login(formData);
      } else {
        if (!isPasswordValid) return; 
        signup(formData);
      }
    });
  };

  return (
    <div className="w-full max-w-md p-8 bg-matte border border-neutral-800 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-neon-cyan/20 blur-md"></div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-avant text-white tracking-widest uppercase">
          {isLogin ? "Identification" : "Request Access"}
        </h2>
        <p className="text-slate-500 font-code text-xs tracking-widest mt-2 uppercase">
          {"// SECURE_CONNECTION_REQUIRED"}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3 border border-neon-red/50 bg-neon-red/10 flex items-start gap-3">
          <div className="w-2 h-2 mt-1.5 rounded-full bg-neon-red animate-pulse"></div>
          <p className="text-xs font-code text-neon-red uppercase tracking-wide">
            ERR: {errorMessage}
          </p>
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        
        <div className="space-y-2">
          <label className="text-xs font-code text-slate-400 tracking-widest uppercase">
            Agent Email
          </label>
          <input 
            type="email" 
            name="email" 
            required 
            className="w-full bg-obsidian border border-neutral-700 text-neon-cyan font-code px-4 py-3 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all placeholder:text-neutral-700"
            placeholder="operator@cipher.drop"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-code text-slate-400 tracking-widest uppercase">
            Passphrase
          </label>
          <input 
            type="password" 
            name="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-obsidian border border-neutral-700 text-neon-cyan font-code px-4 py-3 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all placeholder:text-neutral-700"
            placeholder="••••••••"
          />
        </div>

        {/* THE TERMINAL CHECKLIST (Only visible during registration) */}
        {!isLogin && (
          <div className="space-y-2 bg-obsidian/50 p-4 border border-neutral-800">
            <p className="text-[10px] font-code text-slate-500 tracking-widest uppercase mb-3">
              {"// ENCRYPTION_KEY_REQUIREMENTS"}
            </p>
            
            <div className="space-y-1.5">
              <ChecklistItem label="MIN 10 CHARACTERS" passed={securityChecks.length} />
              <ChecklistItem label="UPPERCASE_ALPHA" passed={securityChecks.uppercase} />
              <ChecklistItem label="LOWERCASE_ALPHA" passed={securityChecks.lowercase} />
              <ChecklistItem label="SPECIAL_SYMBOL" passed={securityChecks.symbol} />
            </div>
          </div>
        )}

        <button 
          type="submit"
          disabled={isPending || (!isLogin && !isPasswordValid)}
          className="w-full py-4 bg-neon-cyan text-obsidian font-bold font-avant tracking-widest uppercase hover:bg-white hover:shadow-lg hover:shadow-neon-cyan/40 transition-all duration-300 disabled:opacity-30 disabled:hover:shadow-none disabled:cursor-not-allowed mt-4"
        >
          {isPending ? "Authenticating..." : isLogin ? "Initialize Session" : "Create Credential"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-neutral-800 text-center">
        <button 
          type="button"
          onClick={() => { setIsLogin(!isLogin); setPassword(""); }}
          className="text-xs font-code text-slate-500 hover:text-neon-cyan tracking-widest uppercase transition-colors"
        >
          {isLogin ? "[ Request New Credentials ]" : "[ Have Existing Credentials? ]"}
        </button>
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="text-xs font-code text-neutral-600 hover:text-white transition-colors uppercase tracking-widest">
          &lt; Return to Base
        </Link>
      </div>
    </div>
  );
}

function ChecklistItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center gap-3 text-xs font-code">
      <span className={passed ? "text-neon-cyan" : "text-neutral-600"}>
        {passed ? "[ OK ]" : "[ -- ]"}
      </span>
      <span className={passed ? "text-slate-300" : "text-neutral-500"}>
        {label}
      </span>
    </div>
  );
}