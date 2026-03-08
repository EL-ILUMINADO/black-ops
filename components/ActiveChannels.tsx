"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// THE FIX: Define the new shape of the channel data
interface Channel {
  connectionId: string;
  targetNum: number; // Added this to match the new AGENT_XXX system
  lastMessage: string;
}

// Helper to format the sequential numbers perfectly
const formatAgentId = (num: number) => `AGENT_${String(num).padStart(3, '0')}`;

export default function ActiveChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchActiveChannels = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get all accepted connections for this operative
      const { data: conns } = await supabase
        .from("connections")
        .select("id, sender_id, recipient_id")
        .eq("status", "accepted")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);

      if (!conns || conns.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Fetch the target profile number and the latest message
      const channelData = await Promise.all(conns.map(async (conn) => {
        const targetId = conn.sender_id === user.id ? conn.recipient_id : conn.sender_id;
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("agent_num") // Fetching the new sequential number
          .eq("id", targetId)
          .single();

        const { data: msg } = await supabase
          .from("messages")
          .select("content")
          .eq("connection_id", conn.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(); // maybeSingle handles cases with no messages yet

        return {
          connectionId: conn.id,
          targetNum: profile?.agent_num || 0,
          lastMessage: msg?.content || "NO_TRANSMISSIONS_YET"
        };
      }));

      setChannels(channelData);
      setLoading(false);
    };

    fetchActiveChannels();
  }, [supabase]);

  if (loading) return <p className="text-[10px] font-code text-neutral-600 animate-pulse uppercase tracking-widest">Scanning Active Frequencies...</p>;

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-neutral-600 space-y-4 py-12">
        <p className="text-xs font-code uppercase tracking-[0.3em]">{"// SECURE_LINE_IDLE"}</p>
        <p className="text-[10px] font-code opacity-50 uppercase mt-2">No active decryption channels established.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-4 animate-in slide-in-from-top-4">
      {channels.map((channel) => (
        <ChannelRow 
          key={channel.connectionId} 
          channel={channel} 
          onClick={() => router.push(`/chat/room/${channel.connectionId}`)} 
        />
      ))}
    </div>
  );
}

function ChannelRow({ channel, onClick }: { channel: Channel; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="p-4 border border-neutral-800 bg-obsidian/40 hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all cursor-pointer group flex flex-col space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_8px_rgba(0,255,255,0.5)] animate-pulse"></div>
          <span className="text-xs font-code text-neon-cyan uppercase tracking-widest">
            {formatAgentId(channel.targetNum)}
          </span>
        </div>
        <span className="text-[9px] font-code text-neutral-600 uppercase group-hover:text-white transition-colors">
          [ Enter Frequency ]
        </span>
      </div>
      
      {/* Scrambled Payload Preview (Raw Text, No Blur) */}
      <div className="pl-6 border-l border-neutral-800 group-hover:border-neon-cyan/30 transition-colors">
        <p className="text-[10px] font-code text-neutral-500 truncate max-w-[80%] opacity-50 select-none">
          {channel.lastMessage}
        </p>
      </div>
    </div>
  );
}