export default function ThreatMatrix() {
  const protocols = [
    {
      id: "PRTCL-01",
      title: "15-Second Auto-Lock",
      description: "Dead-man's switch active. Detects idle states, mouse inactivity, and tab-switching. The interface instantly scrambles if you look away.",
      accent: "border-neon-cyan",
      textAccent: "text-neon-cyan",
      pulse: "bg-neon-cyan"
    },
    {
      id: "PRTCL-02",
      title: "3-Strike Self-Destruct",
      description: "Three incorrect Vault PIN attempts triggers a localized wipe. Browser storage is obliterated, permanently destroying the device's decryption keys.",
      accent: "border-neon-red",
      textAccent: "text-neon-red",
      pulse: "bg-neon-red"
    },
    {
      id: "PRTCL-03",
      title: "72-Hour Server Burn",
      description: "Asynchronous payloads are stored strictly for delivery. An automated database cron job incinerates all encrypted rows after 72 hours. No backups.",
      accent: "border-slate-500",
      textAccent: "text-slate-500",
      pulse: "bg-slate-500"
    }
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-24 border-t border-neutral-900">
      
      {/* Section Header */}
      <div className="mb-16">
        <h2 className="text-3xl md:text-4xl font-bold font-avant text-white mb-4">
          Threat Mitigation Protocols
        </h2>
        <p className="text-slate-400 font-code text-sm">
          {"// SYSTEM_ARCHITECTURE_OVERVIEW"}
        </p>
      </div>

      {/* The Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {protocols.map((protocol) => (
          <div 
            key={protocol.id} 
            className="group relative bg-matte border border-neutral-800 p-8 flex flex-col justify-between transition-colors duration-300 hover:border-neutral-600"
          >
            {/* Top Accent Line */}
            <div className={`absolute top-0 left-0 w-full h-[2px] ${protocol.pulse} opacity-50 group-hover:opacity-100 transition-opacity`}></div>

            <div>
              {/* Protocol ID Tag */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-2 h-2 rounded-full ${protocol.pulse} animate-[pulse_2s_ease-in-out_infinite]`}></div>
                <span className={`text-xs font-code tracking-widest ${protocol.textAccent}`}>
                  {protocol.id}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-bold font-avant text-white mb-4">
                {protocol.title}
              </h3>
              <p className="text-slate-400 font-avant leading-relaxed text-sm">
                {protocol.description}
              </p>
            </div>

            {/* Bottom Tech Detail */}
            <div className="mt-8 pt-6 border-t border-neutral-800">
               <span className="text-[10px] font-code text-neutral-500 tracking-widest uppercase block">
                 Status: Active & Enforced
               </span>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}