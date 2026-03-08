import { create } from 'zustand';

interface SecurityState {
  isUnlocked: boolean;
  vaultHash: string | null;
  failedAttempts: number;
  
  // Actions
 lockChat: () => void;
  unlockChat: (pin: string) => boolean;
  setVaultPin: (pin: string) => void;
  registerFailedAttempt: () => void;
  triggerSelfDestruct: () => void;

  selectedAgent: { id: string; email: string } | null;
  setSelectedAgent: (agent: { id: string; email: string } | null) => void;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  isUnlocked: false, // Default: Trust no one. Always start locked.
  vaultHash: null,
  
  failedAttempts: 0, 



lockChat: () => set({ isUnlocked: false }),
setVaultPin: (pin: string) => {
  // In a real ops app, we'd use SHA-256. For now, a simple b64 for logic.
  const hash = btoa(pin); 
  set({ vaultHash: hash, isUnlocked: true });
},

unlockChat: (pin: string) => {
        const hash = btoa(pin);
        if (hash === get().vaultHash) {
          set({ isUnlocked: true });
          return true;
        }
        return false;
      },

  registerFailedAttempt: () => {
    const newStrikes = get().failedAttempts + 1;
    set({ failedAttempts: newStrikes });
    
    // Save the strike to local storage to prevent refresh-cheating
    if (typeof window !== 'undefined') {
      localStorage.setItem('black_ops_strikes', newStrikes.toString());
    }

    // The 3-Strike Protocol
    if (newStrikes >= 3) {
      get().triggerSelfDestruct();
    }
  },

  triggerSelfDestruct: () => {
    // The Nuclear Option
    if (typeof window !== 'undefined') {
      // 1. Wipe the browser storage entirely (destroying local decryption keys)
      localStorage.clear();
      sessionStorage.clear();
      
      // 2. Force a hard reload to clear any React memory state
      window.location.reload(); 
    }
  },

  selectedAgent: null,
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
}));