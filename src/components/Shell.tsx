import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { FlaskIcon } from "./Icons";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <FlaskIcon className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-semibold tracking-tight">
                Organic Nomenclature Studio
              </span>
              <span className="block text-xs text-muted-foreground">
                Naming and structure practice
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink to="/practice">Practice</NavLink>
            <NavLink to="/results">Results</NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10">{children}</main>
      <footer className="border-t border-border/70 py-6 text-center text-xs text-muted-foreground">
        Standalone practice activity — embed- and launch-ready. Grade passback would require a later
        LTI integration.
      </footer>
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "bg-secondary text-secondary-foreground" }}
      className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
    >
      {children}
    </Link>
  );
}
