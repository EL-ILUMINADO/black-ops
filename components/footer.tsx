import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-neutral-900 bg-obsidian py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Side: Branding & Copyright */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="text-white font-avant font-bold tracking-widest uppercase text-sm">
            Cipher Drop
          </span>
          <span className="text-xs font-code text-slate-500">
            &copy; {new Date().getFullYear()} {"// NO_LOGS_KEPT"}
          </span>
        </div>

        {/* Right Side: Tactical Links */}
        <div className="flex items-center gap-6 text-xs font-code text-slate-500 uppercase tracking-widest">
          {/* A fake privacy policy that just reinforces the pitch */}
          <span className="hover:text-neon-cyan transition-colors cursor-crosshair">
            Privacy: Burned
          </span>
          
          <Link 
            href="https://github.com/EL-ILUMINADO" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neon-cyan transition-colors cursor-crosshair"
          >
            Target_Repo
          </Link>
        </div>

      </div>
    </footer>
  );
}