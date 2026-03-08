"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { encryptPayload } from "@/utils/cipher";

interface MessageInputProps {
  connectionId: string;
  sharedEncryptKey: string; // Updated prop name to reflect the actual cipher
}

type BurnHours = 1 | 24 | 72;

export default function MessageInput({ connectionId, sharedEncryptKey }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [burnTime, setBurnTime] = useState<BurnHours>(24);
  const supabase = createClient();

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);

    const burnAtDate = new Date();
    burnAtDate.setHours(burnAtDate.getHours() + burnTime);
    
    // Encrypts using the SHARED password so the other operative can read it
    const scrambledPayload = encryptPayload(message, sharedEncryptKey);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase.from("messages").insert({
        content: scrambledPayload,
        sender_id: user.id,
        connection_id: connectionId,
        burn_at: burnAtDate.toISOString(),
      });

      if (error) {
        alert(`INTERCEPTED: ${error.message}`);
      }
    }

    setMessage("");
    setLoading(false);
  };

  // ... The rest of the return statement with the UI remains exactly the same as before ...
  return (
     // (Keep your existing JSX for the input and burn buttons here)
    <div className="flex flex-col space-y-4 w-full">
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="ENTER ENCRYPTED PAYLOAD..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="grow bg-obsidian border border-neutral-800 p-4 text-sm font-code text-neon-cyan focus:border-neon-cyan focus:outline-none transition-all placeholder:text-neutral-600"
        />
        <button
          onClick={handleSend}
          disabled={loading || !message}
          className="px-8 py-4 bg-neon-cyan text-obsidian font-bold font-code uppercase hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-neon-cyan"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
      
      {/* Burn Protocol UI */}
      <div className="flex items-center justify-between text-[9px] font-code text-neutral-600 uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <span>Burn_Protocol:</span>
          <button onClick={() => setBurnTime(1)} className={`px-2 py-1 border transition-colors ${burnTime === 1 ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10' : 'border-neutral-800 hover:text-neon-cyan'}`}>1h</button>
          <button onClick={() => setBurnTime(24)} className={`px-2 py-1 border transition-colors ${burnTime === 24 ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10' : 'border-neutral-800 hover:text-neon-cyan'}`}>24h</button>
          <button onClick={() => setBurnTime(72)} className={`px-2 py-1 border transition-colors ${burnTime === 72 ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10' : 'border-neutral-800 hover:text-neon-cyan'}`}>72h</button>
        </div>
        <span>[ TRANSMISSION_SECURE ]</span>
      </div>
    </div>
  );
}