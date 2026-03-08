"use client";

import { useEffect, useState } from "react";
import { useInactivityTimer } from "@/hooks/useInactivityTimer";
import { useSecurityStore } from "@/store/useSecurityStore";
import VaultPinModal from "@/components/VaultPinModal";
import LogoutModal from "@/components/LogoutModal";
import AgentList from "@/components/AgentList";
import ActiveChannels from "@/components/ActiveChannels"; 
import { createClient } from "@/utils/supabase/client";

export default function ChatDashboard() {
  // Arm the dead-man's switch (15s auto-lock)
  useInactivityTimer();

  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"messages" | "users">("messages");

  const [agentNum, setAgentNum] = useState<number | null>(null);
  const supabase = createClient();

  // Helper to format the ID
  const formatAgentId = (num: number | null) => {
    if (num === null) return "IDENTIFYING...";
    return `AGENT_${String(num).padStart(3, '0')}`;
  };

  useEffect(() => {
    const fetchMyId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("agent_num")
        .eq("id", user.id)
        .single();

      if (data) setAgentNum(data.agent_num);
    };
    fetchMyId();
  }, [supabase]);

  // Connect to security state
  const { isUnlocked, lockChat } = useSecurityStore();

  return (
    <div className="min-h-[85vh] w-full max-w-7xl mx-auto px-6 py-8 flex flex-col">
      
      {/* HEADER: Identity & Terminate */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-avant text-white uppercase tracking-widest">
            Active Workspace
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isUnlocked ? 'bg-neon-cyan' : 'bg-neon-red'}`}></div>
            <p className="text-xs font-code text-slate-500 tracking-widest uppercase">
              IDENT: <span className="text-neon-cyan/80 font-bold">{formatAgentId(agentNum)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* WORKSPACE FRAME: mt-8 adds spacing from the header */}
      <div className="grow flex flex-col border border-neutral-800 bg-matte relative overflow-hidden mt-8">
        
        {!isUnlocked ? (
          /* LOCKED: High-Security PIN Input */
          <div className="grow flex flex-col items-center justify-center space-y-8 z-10 p-8">
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
          /* UNLOCKED: Multi-Tab Terminal */
          <div className="w-full h-full flex flex-col z-10">
            
            {/* TABS */}
            <div className="flex border-b border-neutral-800 bg-obsidian/30">
              <button 
                onClick={() => setActiveTab("messages")}
                className={`flex-1 py-4 text-[10px] font-code uppercase tracking-[0.2em] transition-all ${activeTab === "messages" ? "text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5" : "text-neutral-500 hover:text-white"}`}
              >
                [ 01_Messages ]
              </button>
              <button 
                onClick={() => setActiveTab("users")}
                className={`flex-1 py-4 text-[10px] font-code uppercase tracking-[0.2em] transition-all ${activeTab === "users" ? "text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5" : "text-neutral-500 hover:text-white"}`}
              >
                [ 02_Active_Agents ]
              </button>
            </div>

            {/* CONTENT AREA */}
            <div className="grow overflow-hidden flex flex-col pt-8">
              {activeTab === "messages" ? (
                // TAB 1: Shows active conversations and scrambled previews
                <div className="grow overflow-y-auto px-8 flex flex-col items-center">
                  <ActiveChannels />
                </div>
              ) : (
                // TAB 2: Shows the global agent directory and handshake requests
                <div className="grow overflow-y-auto px-8">
                   <AgentList />
                </div>
              )}
            </div>
            
            <button 
              onClick={lockChat}
              className="absolute bottom-4 right-4 text-[9px] font-code text-neutral-700 hover:text-neon-cyan uppercase transition-colors z-20"
            >
              [ Manual_Lock ]
            </button>
          </div>
        )}

        {/* Tactical Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* Security Modals */}
      <LogoutModal isOpen={isLogoutOpen} onCloseAction={() => setIsLogoutOpen(false)} />
    </div>
  );
}