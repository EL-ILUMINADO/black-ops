# 📡 PROJECT: CIPHER DROP // [ LEVEL 5 CLEARANCE ]

**Status:** ACTIVE OPERATIONAL  
**Encryption:** Dual-Cipher XOR + SHA-256 Hashing  
**Protocol:** Zero-Knowledge / Hostile Environment UX

---

## ⚡ MISSION OBJECTIVE
Cipher Drop is a high-security, ephemeral communication platform designed for hostile digital environments. Every message is a "burned" payload, and every session is protected by a multi-layered cryptographic handshake.

## 🛠 TECH STACK [ THE ARMORY ]
* **Framework**: Next.js 15 (App Router)
* **Language**: TypeScript (Strict Mode)
* **Database**: Supabase (PostgreSQL)
* **Auth**: Supabase Auth + Custom Multi-Factor Vault Keys
* **Styling**: Tailwind CSS v4
* **State**: Zustand (Security Store)

---

## 🔐 SECURITY ARCHITECTURE [ PROTOCOLS ]

### 1. The Dual-Lock Handshake
To enter a secure frequency, an operative must provide two distinct ciphers:
* **Shared Chat Password**: A secret known only to the participants, never stored in plain text.
* **Local 24h Vault Key**: A temporary, expiring authority key generated during the handshake and stored in a personal vault.

### 2. XOR Payload Encryption
Messages are encrypted client-side using a lightweight XOR cipher before transmission. The server only ever sees the mathematical "noise" of the payload.
* **Tripwire Validation**: Every payload contains a hidden `SECURE::` signature. If decrypted with an incorrect key, the system detects the tripwire breach and refuses to display the content.

### 3. The Dead Man's Switch (Auto-Lock)
The workspace monitors operative presence in real-time. If no physical activity (mouse/keyboard) is detected for **20 seconds**, the system:
1.  Locks the global workspace.
2.  Purges all decryption ciphers from React state memory.
3.  Displays the **Workspace Locked** interrogation screen.

### 4. Breach Radar
The application actively listens for unauthorized handshake attempts targeting your ID while you are in a secure room. If an intercept is detected, the screen flashes neon red and slams the current session shut.

### 5. Automated Janitor (Self-Destruct)
A server-side `pg_cron` job scans the database every 60 seconds. Any message past its `burn_at` timestamp is physically vaporized from the server.

---

## 🖥 INTERFACE OVERVIEW [ THE HUD ]

### Active Workspace
* **IDENT**: Sequential operative designations (`AGENT_001`, `AGENT_002`) based on database entry order.
* **Tactical Tabs**: 
    * `[ 01_Messages ]`: Active channels with unblurred, scrambled payload previews.
    * `[ 02_Active_Agents ]`: Global directory for initiating new secure frequencies.

### Secure Room
* **Retreat Protocol**: `[ <- Return ]` button allows movement back to the workspace without killing the frequency.
* **Kill Switch**: `[ Terminate_Link ]` permanently deletes the local vault key for that specific room.

---

## 🚀 DEPLOYMENT

### Initial Setup
1.  **Clone the Repository**:
    ```bash
    git clone [https://github.com/EL-ILUMINADO/black-ops.git](https://github.com/EL-ILUMINADO/black-ops.git)
    cd black-ops
    ```
2.  **Install Dependencies**:
    ```bash
    pnpm install
    ```
3.  **Environment Variables**:
    Create a `.env.local` with your Supabase keys:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
    ```

### Database Initialization (SQL)
Execute the following protocols in your Supabase SQL editor:
* `profiles`: Add `agent_num` (SERIAL) for sequential IDs.
* `personal_vault_keys`: Table for storing per-user decryption authorities.
* `pg_cron`: Enable and schedule the 60-second message sweep.

---

## ⚠️ WARNING
This system is designed for **ephemeral** communication. There is no password recovery for shared chat ciphers. If a key is lost, the transmission is lost forever.