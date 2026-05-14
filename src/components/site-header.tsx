import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-readycheck.png";

const nav = [
  { to: "/", label: "Home" },
  { to: "/solutions", label: "Solutions" },
  { to: "/products", label: "Products" },
  { to: "/research", label: "Research" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const isDark = variant === "dark";
  const linkBase = isDark ? "text-white/80 hover:text-white" : "text-foreground/70 hover:text-foreground";
  const activeBase = isDark ? "text-white border-white/80" : "text-foreground border-primary";

  return (
    <header
      className={`max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4 ${isDark ? "text-white" : ""}`}
      style={isDark ? { background: "linear-gradient(180deg, oklch(0.16 0.07 265) 0%, oklch(0.18 0.08 265) 60%, transparent 100%)" } : undefined}
    >
      <Link to="/" className="flex items-center gap-3">
        <img src={logo} alt="ReadyCheck Lab — Measure. Learn. Improve." className="h-[4.55rem] w-auto" />
      </Link>
      <nav className="hidden md:flex items-center gap-7 text-sm">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={linkBase}
            activeProps={{ className: `border-b-2 pb-0.5 ${activeBase}` }}
            activeOptions={{ exact: true }}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <Link to="/login" className="hidden sm:block">
          <Button variant="ghost" className={isDark ? "text-white hover:bg-white/10 hover:text-white" : ""}>
            Sign in
          </Button>
        </Link>
        <Link to="/signup">
          <Button className="rounded-md bg-[oklch(0.6_0.22_255)] hover:bg-[oklch(0.65_0.22_255)] text-white">
            Get Started
          </Button>
        </Link>
      </div>
    </header>
  );
}