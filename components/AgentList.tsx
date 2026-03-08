"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import HandshakeModal from "./HandshakeModal";
import ReceiptModal from "./ReceiptModal";
import AcceptRequestModal from "./AcceptanceRequestModal";

// Helper to format the sequential numbers perfectly
const formatAgentId = (num?: number) => {
  if (!num) return "UNKNOWN_AGENT";
  return `AGENT_${String(num).padStart(3, '0')}`;
};

// Updated Interfaces
interface Agent {
  id: string;
  email: string;
  agent_num: number;
  activeConnectionId?: string | null;
}

interface IncomingRequest {
  id: string;
  senderId: string;
  senderNum: number;
}

interface ReceiptRequest {
  id: string;
  targetNum: number;
}

interface ConnectionData {
  id: string;
  sender_id: string;
  recipient_id: string;
}

export default function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [receiptRequests, setReceiptRequests] = useState<ReceiptRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedForLink, setSelectedForLink] = useState<Agent | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<IncomingRequest | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRequest | null>(null);

  const supabase = createClient();

  const fetchRadarData = useCallback(async (isMounted = true) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Fetch Profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, agent_num")
      .not("id", "eq", user.id);

    // 2. Fetch User's Finalized Vault Keys
    const { data: vaultKeys } = await supabase
      .from("personal_vault_keys")
      .select("connection_id")
      .eq("user_id", user.id);
    
    const vaultConnectionIds = vaultKeys?.map(k => k.connection_id) || [];

    // 3. Get actual connections using our strict interface
    let activeConnections: ConnectionData[] = [];
    if (vaultConnectionIds.length > 0) {
      const { data: conns } = await supabase
        .from("connections")
        .select("id, sender_id, recipient_id")
        .in("id", vaultConnectionIds);
      
      activeConnections = (conns as ConnectionData[]) || [];
    }

    if (profiles && isMounted) {
      const mappedAgents = profiles.map(p => {
        const activeConn = activeConnections.find(c => c.sender_id === p.id || c.recipient_id === p.id);
        return {
          id: p.id,
          email: p.email,
          agent_num: p.agent_num,
          activeConnectionId: activeConn?.id || null
        };
      });
      // Sort by agent number so it's a clean list
      setAgents(mappedAgents.sort((a, b) => a.agent_num - b.agent_num));
    }

    // 4. Fetch Incoming Pending Handshakes
    const { data: incomingConns } = await supabase
      .from("connections")
      .select("id, sender_id")
      .eq("recipient_id", user.id)
      .eq("status", "pending");

    if (incomingConns && profiles && isMounted) {
      const formatted = incomingConns.map(conn => ({
        id: conn.id,
        senderId: conn.sender_id,
        senderNum: profiles.find(p => p.id === conn.sender_id)?.agent_num || 0
      }));
      setIncomingRequests(formatted);
    }

    // 5. Fetch Awaiting Receipts
    const { data: acceptedConns } = await supabase
      .from("connections")
      .select("id, recipient_id")
      .eq("sender_id", user.id)
      .eq("status", "accepted");

    if (acceptedConns && profiles && isMounted) {
      const finalizedIds = new Set(vaultConnectionIds);
      
      const pendingReceipts = acceptedConns
        .filter(conn => !finalizedIds.has(conn.id))
        .map(conn => ({
          id: conn.id,
          targetNum: profiles.find(p => p.id === conn.recipient_id)?.agent_num || 0
        }));
        
      setReceiptRequests(pendingReceipts); 
    }

    if (isMounted) setLoading(false);
  }, [supabase]); // useCallback dependency

  useEffect(() => {
    let isMounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRadarData(isMounted);

    const channel = supabase
      .channel("radar_updates")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "connections"
      }, () => { 
        fetchRadarData(isMounted); 
      })
      .subscribe();

    return () => { 
      isMounted = false; 
      supabase.removeChannel(channel); 
    };
  }, [supabase, fetchRadarData]); // The linter is now happy

  if (loading) return <p className="text-[10px] font-code text-neutral-600 animate-pulse uppercase tracking-widest">Scanning Frequencies...</p>;

  return (
    <div className="w-full max-w-md space-y-8 pb-12">
      
      {/* SECTION 1: AWAITING RECEIPT */}
      {receiptRequests.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2 border-b border-neon-cyan/30 pb-2">
            <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,255,0.5)]"></div>
            <h3 className="text-[10px] font-code text-neon-cyan uppercase tracking-widest">
              Link Accepted ({receiptRequests.length})
            </h3>
          </div>
          {receiptRequests.map((req) => (
            <ReceiptRow 
              key={req.id} 
              request={req} 
              onViewClick={() => setSelectedReceipt(req)} 
            />
          ))}
        </div>
      )}

      {/* SECTION 2: INCOMING INTERCEPTS */}
      {incomingRequests.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2 border-b border-neon-red/30 pb-2">
            <div className="w-2 h-2 bg-neon-red rounded-full animate-ping"></div>
            <h3 className="text-[10px] font-code text-neon-red uppercase tracking-widest">
              Signal Intercepted ({incomingRequests.length})
            </h3>
          </div>
          {incomingRequests.map((req) => (
            <IncomingRequestRow 
              key={req.id} 
              request={req} 
              onViewClick={() => setSelectedRequest(req)} 
            />
          ))}
        </div>
      )}

      {/* SECTION 3: ACTIVE AGENTS DIRECTORY */}
      <div className="space-y-4">
        <div className="border-b border-neutral-800 pb-2">
          <h3 className="text-[10px] font-code text-neutral-500 uppercase tracking-widest">
            Global Agent Directory
          </h3>
        </div>
        
        {agents.length === 0 ? (
          <div className="text-center space-y-4 py-8">
            <p className="text-xs font-code text-neutral-600 uppercase tracking-widest">{"// NO_OTHER_AGENTS_IN_VICINITY"}</p>
            <p className="text-[10px] font-code text-neutral-800 uppercase">Scanning for secure signals...</p>
          </div>
        ) : (
          agents.map((agent) => (
            <AgentRow 
              key={agent.id} 
              agent={agent} 
              onLinkClick={() => setSelectedForLink(agent)} 
            />
          ))
        )}
      </div>

      <HandshakeModal 
        isOpen={!!selectedForLink}
        targetAgent={selectedForLink}
        onCloseAction={() => {
          setSelectedForLink(null);
          fetchRadarData(); 
        }}
      />

      <AcceptRequestModal 
        isOpen={!!selectedRequest}
        request={selectedRequest ? { id: selectedRequest.id, senderEmail: `Agent ${selectedRequest.senderNum}` } : null}
        onCloseAction={() => {
          setSelectedRequest(null);
          fetchRadarData(); 
        }}
      />

      <ReceiptModal 
        isOpen={!!selectedReceipt}
        request={selectedReceipt ? { id: selectedReceipt.id, targetEmail: `Agent ${selectedReceipt.targetNum}` } : null}
        onCloseAction={() => {
          setSelectedReceipt(null);
          fetchRadarData(); 
        }}
      />
    </div>
  );
}

// ---- SUB-COMPONENTS FOR THE LIST ROWS ----

function AgentRow({ agent, onLinkClick }: { agent: Agent; onLinkClick: () => void }) {
  const router = useRouter();

  const handleAction = () => {
    if (agent.activeConnectionId) {
      router.push(`/chat/room/${agent.activeConnectionId}`);
    } else {
      onLinkClick();
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border border-neutral-800 bg-obsidian/40 hover:border-neon-cyan/50 transition-colors group">
      <div className="flex items-center gap-4">
        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,255,255,0.5)] ${agent.activeConnectionId ? 'bg-neon-cyan animate-pulse' : 'bg-neutral-600'}`}></div>
        <span className="text-xs font-code text-slate-300 uppercase tracking-widest">
          {formatAgentId(agent.agent_num)}
        </span>
      </div>
      <button 
        onClick={handleAction} 
        className={`text-[10px] font-code uppercase transition-colors ${
          agent.activeConnectionId 
            ? "text-neon-cyan font-bold hover:text-white" 
            : "text-neutral-600 group-hover:text-neon-cyan"
        }`}
      >
        {agent.activeConnectionId ? "[ Start Messaging ]" : "[ Establish Link ]"}
      </button>
    </div>
  );
}

function IncomingRequestRow({ request, onViewClick }: { request: IncomingRequest; onViewClick: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 border border-neon-red/40 bg-neon-red/5 hover:bg-neon-red/10 transition-colors">
      <div className="flex items-center gap-4">
        <span className="text-xs font-code text-neon-red uppercase tracking-widest">
          {formatAgentId(request.senderNum)}
        </span>
      </div>
      <button 
        onClick={onViewClick} 
        className="text-[10px] font-code text-obsidian bg-neon-red px-3 py-1 font-bold hover:bg-white transition-colors uppercase"
      >
        [ View Protocol ]
      </button>
    </div>
  );
}

function ReceiptRow({ request, onViewClick }: { request: ReceiptRequest; onViewClick: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 border border-neon-cyan/40 bg-neon-cyan/5 hover:bg-neon-cyan/10 transition-colors">
      <div className="flex items-center gap-4">
        <span className="text-xs font-code text-neon-cyan uppercase tracking-widest">
          {formatAgentId(request.targetNum)}
        </span>
      </div>
      <button 
        onClick={onViewClick} 
        className="text-[10px] font-code text-obsidian bg-neon-cyan px-3 py-1 font-bold hover:bg-white transition-colors uppercase"
      >
        [ Retrieve Cipher ]
      </button>
    </div>
  );
}