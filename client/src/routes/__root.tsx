import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import {
  ChatCircleDots,
  HardDrives,
  Files,
  ArrowSquareOut,
} from "@phosphor-icons/react";

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
  icon: React.ComponentType<{ size: number; weight?: string }>;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] [&.active]:text-[var(--color-text-primary)] [&.active]:bg-[var(--color-surface)]"
    >
      <Icon size={18} weight="bold" />
      {label}
    </Link>
  );
}

function RootLayout() {
  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 bg-[var(--color-canvas)] border-r border-[var(--color-border)] flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[var(--color-border)]">
          <h1 className="text-base font-semibold tracking-tight text-[var(--color-text-primary)]">
            RAG Local
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 font-mono">
            v1.0.0
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <NavLink to="/" label="Chat" icon={ChatCircleDots} />
          <NavLink to="/models" label="Modelos" icon={HardDrives} />
          <NavLink to="/documents" label="Documentos" icon={Files} />
        </nav>

        {/* External Links */}
        <div className="px-3 pb-4 border-t border-[var(--color-border)] pt-4">
          <a
            href="http://localhost:6333/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors duration-150"
          >
            <ArrowSquareOut size={18} weight="bold" />
            Qdrant Dashboard
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-[var(--color-surface)]">
        <Outlet />
      </main>
    </div>
  );
}
