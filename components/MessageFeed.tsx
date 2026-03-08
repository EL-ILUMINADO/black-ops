"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { decryptPayload } from "@/utils/cipher";

interface MessageFeedProps {
  connectionId: string;
}

interface Message {
  id: string;
  content: string; 
  sender_id: string;
  created_at: string;
}

export default function MessageFeed({ connectionId }: MessageFeedProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();
  
  // THE AUTO-SCROLL ANCHOR
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setupRoom = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("connection_id", connectionId)
        .order("created_at", { ascending: true });
        
      if (data) setMessages(data);
    };

    setupRoom();

    const channel = supabase
      .channel(`room_${connectionId}`)
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "messages",
        filter: `connection_id=eq.${connectionId}` 
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [connectionId, supabase]);

  // Tell the window to scroll to the anchor whenever 'messages' change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="grow overflow-y-auto p-6 space-y-6 custom-scrollbar flex flex-col">
      {messages.length === 0 ? (
        <div className="grow flex flex-col items-center justify-center text-neutral-600 space-y-4">
          <p className="text-xs font-code uppercase tracking-[0.3em]">{"// NO_INTERCEPTED_PAYLOADS"}</p>
        </div>
      ) : (
        messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isMe={msg.sender_id === currentUserId} />
        ))
      )}
      {/* THE INVISIBLE ANCHOR */}
      <div ref={bottomRef} />
    </div>
  );
}

// ---- THE HOSTILE MESSAGE COMPONENT ----
function MessageBubble({ msg, isMe }: { msg: Message, isMe: boolean }) {
  const [mode, setMode] = useState<"LOCKED" | "PROMPT" | "REVEALED">("LOCKED");
  const [inputCipher, setInputCipher] = useState("");
  const [decryptedText, setDecryptedText] = useState("");
  const [timeLeft, setTimeLeft] = useState(5);

  // The 5-Second Auto-Scramble Timer
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (mode === "REVEALED") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft(5); 
      
      intervalId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setMode("LOCKED");
            setDecryptedText("");
            clearInterval(intervalId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [mode]);

  const handleManualDecrypt = () => {
    if (!inputCipher) return;
    
    const result = decryptPayload(msg.content, inputCipher);
    
    if (result === "ERR_INVALID_CIPHER") {
      setDecryptedText("[ INTERCEPT FAILED // INVALID SHARED CIPHER ]");
    } else {
      setDecryptedText(result);
    }
    
    setMode("REVEALED");
    setInputCipher(""); 
  };

  return (
    <div className={`flex flex-col space-y-2 ${isMe ? 'items-end' : 'items-start'}`}>
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-code text-neon-cyan uppercase tracking-widest">
          {isMe ? "[ YOUR_SIGNAL ]" : "[ TARGET_AGENT ]"}
        </span>
        <span className="text-[9px] font-code text-neutral-600">
          {new Date(msg.created_at).toLocaleTimeString()}
        </span>
      </div>
      
      <div className={`p-4 border max-w-[80%] transition-all ${isMe ? 'border-neon-cyan/30 bg-neon-cyan/5' : 'border-neutral-800 bg-obsidian'}`}>
        
        {/* STATE 1: LOCKED (Shows Raw Scrambled Cipher, NO BLUR) */}
        {mode === "LOCKED" && (
          <>
            <p className="text-sm font-code leading-relaxed break-all text-neutral-500 opacity-70 select-none">
              {msg.content}
            </p>
            <div className={`flex mt-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
              <button 
                onClick={() => setMode("PROMPT")}
                className="text-[9px] font-code px-3 py-1 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 transition-colors uppercase"
              >
                [ DECRYPT ]
              </button>
            </div>
          </>
        )}

        {/* STATE 2: INTERROGATION PROMPT */}
        {mode === "PROMPT" && (
          <div className="space-y-3">
            <p className="text-[9px] font-code text-neon-red uppercase">
              {"// ENTER SHARED CHAT PASSWORD TO UNLOCK"}
            </p>
            <div className="flex gap-2">
              <input 
                type="password"
                value={inputCipher}
                onChange={(e) => setInputCipher(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualDecrypt()}
                className="bg-matte border border-neutral-700 p-2 text-xs font-code text-white focus:border-neon-red focus:outline-none w-full"
                autoFocus
              />
              <button 
                onClick={handleManualDecrypt}
                className="bg-neon-red text-obsidian px-3 text-[9px] font-bold font-code hover:bg-white transition-colors"
              >
                UNWRAP
              </button>
            </div>
            <button 
              onClick={() => setMode("LOCKED")}
              className="text-[9px] font-code text-neutral-500 hover:text-white uppercase"
            >
              [ Cancel ]
            </button>
          </div>
        )}

        {/* STATE 3: REVEALED (With Auto-Scramble Countdown) */}
        {mode === "REVEALED" && (
          <>
            <p className="text-sm font-code leading-relaxed break-words text-white">
              {decryptedText}
            </p>
            <div className={`flex mt-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
              <button 
                onClick={() => {
                  setMode("LOCKED");
                  setDecryptedText("");
                }}
                className="text-[9px] font-code px-3 py-1 border border-neon-red text-neon-red hover:bg-neon-red/10 transition-colors uppercase flex items-center gap-2"
              >
                <span>[ SCRAMBLE ]</span>
                <span className="text-white">({timeLeft}s)</span>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}