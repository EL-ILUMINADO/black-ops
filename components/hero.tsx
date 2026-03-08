"use client"; 

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Hero() {
  // A tiny bit of state to make the "Proof" terminal feel alive
  const [cursorBlink, setCursorBlink] = useState(true);

  // Blinking cursor effect for the terminal
  useEffect(() => {
    const interval = setInterval(() => setCursorBlink((prev) => !prev), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 pt-20 pb-32 flex items-center min-h-[85vh]">
      
      {/* The Grid: 
        1 column on mobile, 2 columns on large screens. 
        gap-16 adds breathing room between the text and the terminal.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
        
        {/* === LEFT COLUMN: THE PITCH === */}
        <div className="flex flex-col items-start space-y-8 z-10">
          
          {/* A tactical badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-cyan/30 bg-neon-cyan/5">
            <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></div>
            <span className="text-xs font-code text-neon-cyan tracking-widest uppercase">
              End-to-End Encrypted
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold font-avant leading-tight text-white">
            Trust no one. <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#e2e8f0] to-[#475569]">
              Leave no trace.
            </span>
          </h1>

          <p className="text-lg text-slate-400 font-avant max-w-md leading-relaxed">
            Military-grade, ephemeral messaging. Your keys never leave your device. 
            No database logs. Auto-locking interface. If they aren&apos;t looking at the screen, they aren&apos;t reading it.
          </p>

          <div className="flex items-center gap-6 pt-4">
            <Link 
              href="/auth" 
              className="px-8 py-4 bg-neon-cyan text-obsidian font-bold tracking-widest uppercase font-avant hover:bg-white transition-colors duration-300 shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)]"
            >
              Deploy Workspace
            </Link>
          </div>
        </div>

        {/* === RIGHT COLUMN: THE PROOF === */}
        <div className="relative z-10 w-full max-w-lg mx-auto lg:ml-auto">
          {/* A glowing blur behind the terminal for depth */}
          <div className="absolute -inset-1 bg-linear-to-r from-neon-cyan/20 to-transparent blur-2xl rounded-lg"></div>
          
          {/* The Terminal UI */}
          <div className="relative bg-matte border border-[#333] rounded-sm shadow-2xl overflow-hidden flex flex-col">
            
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-obsidian/50">
              <span className="text-xs font-code text-slate-500 uppercase tracking-widest">Target_Connection: Active</span>
              {/* Padlock Icon (CSS drawn to avoid SVGs for now) */}
              <div className="w-3 h-4 border-2 border-neon-cyan rounded-t-full relative">
                 <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-3 bg-neon-cyan rounded-sm -mt-0.5"></div>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-6 font-code text-sm sm:text-base leading-relaxed wrap-break-word text-neon-cyan opacity-80">
              <p>
                <span className="text-slate-500">{"// INCOMING PAYLOAD_"}</span> <br />
                x$89#q!z 76QBLU!$164 v9@kLp*2 <br />
                m#44Qx! 00192A&b nZ*88!pQ <br />
                L9%x 110a! Mq$v <span className={`${cursorBlink ? 'opacity-100' : 'opacity-0'}`}>█</span>
              </p>
              
              {/* Fake Decrypt Button demonstrating the UI */}
              <div className="mt-8 border border-neon-cyan/40 bg-neon-cyan/10 text-center py-2 cursor-not-allowed hover:bg-neon-cyan/20 transition-colors">
                <span className="text-xs tracking-widest uppercase text-neon-cyan">Press to Decrypt</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}