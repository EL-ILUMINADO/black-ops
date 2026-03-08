"use client";
import { useState, useRef } from "react";
import { useSecurityStore } from "@/store/useSecurityStore";

export default function VaultPinModal() {
  const [pin, setPin] = useState(new Array(8).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { unlockChat, vaultHash, setVaultPin } = useSecurityStore();
  const [error, setError] = useState(false);

  const isSetup = !vaultHash;

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (value && index < 7) inputRefs.current[index + 1]?.focus();

    if (newPin.every(digit => digit !== "")) {
      const fullPin = newPin.join("");
      if (isSetup) {
        setVaultPin(fullPin);
      } else {
        const success = unlockChat(fullPin);
        if (!success) {
          setError(true);
          setPin(new Array(8).fill(""));
          inputRefs.current[0]?.focus();
          setTimeout(() => setError(false), 1000);
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <h3 className="text-[10px] font-code text-neon-cyan tracking-widest uppercase">
        {isSetup ? "// INITIALIZE_NEW_VAULT" : "// VERIFY_VAULT_AUTHORITY"}
      </h3>
      <div className={`grid grid-cols-4 md:grid-cols-8 gap-3 transition-all ${error ? 'animate-shake border-neon-red' : ''}`}>
        {pin.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="password"
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            className="w-10 h-14 bg-obsidian border-2 border-neutral-800 text-neon-cyan text-center focus:border-neon-cyan focus:outline-none transition-all font-code"
          />
        ))}
      </div>
      {error && <p className="text-[9px] font-code text-neon-red uppercase animate-pulse">Invalid Credentials</p>}
    </div>
  );
}