import { createRootRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  ChatCircleDots,
  HardDrives,
  Files,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";

import { IconWeight } from "@phosphor-icons/react";

export const Route = createRootRoute({
  component: RootLayout,
});

function NavLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ size: number; weight?: IconWeight; className?: string }>;
}) {
  return (
    <Link
      to={to}
      className="relative flex items-center gap-3.5 px-4 py-3 rounded-[14px] text-[13.5px] font-medium transition-colors duration-200 group overflow-hidden text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
      activeProps={{ className: "!text-white" }}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="activeNavTab"
              className="absolute inset-0 bg-[#1A1A1A] border border-white/[0.08] rounded-[14px]"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <div className="relative z-10 flex items-center gap-3.5 w-full">
            <Icon size={20} weight={isActive ? "fill" : "regular"} className="transition-all duration-300" />
            {label}
          </div>
        </>
      )}
    </Link>
  );
}

function RootLayout() {
  const location = useLocation();

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#0A0A0A] text-zinc-100 font-sans selection:bg-zinc-800">
      {/* Sidebar */}
      <aside className="w-[280px] shrink-0 bg-[#0A0A0A] border-r border-[#222222] flex flex-col relative z-20">
        {/* Logo Area */}
        <div className="px-8 pt-10 pb-10">
          <h1 className="text-[17px] font-semibold tracking-tight text-white flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
            RAG Engine
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 flex flex-col gap-1">
          <NavLink to="/" label="Playground" icon={ChatCircleDots} />
          <NavLink to="/models" label="Language Models" icon={HardDrives} />
          <NavLink to="/documents" label="Knowledge Base" icon={Files} />
        </nav>

        {/* Footer / External Links */}
        <div className="p-4 mb-4">
          <a
            href="http://localhost:6333/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3.5 rounded-2xl text-[13px] font-medium text-zinc-400 border border-white/5 bg-[#111111] hover:text-white hover:bg-[#1A1A1A] hover:border-white/10 transition-all duration-300 group"
          >
            <span className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-[#222222] flex items-center justify-center">
                <ArrowSquareOut size={14} weight="bold" className="text-zinc-300" />
              </div>
              Qdrant Engine
            </span>
            <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors">
              Port 6333
            </span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col overflow-hidden bg-[#0A0A0A]">
        {/* Ambient Subtle Glow - Very Minimalist */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.02] blur-[120px] rounded-[100%] pointer-events-none" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 relative z-10 h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
