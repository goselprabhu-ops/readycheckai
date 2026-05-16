import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-readycheck.png";

const nav = [
  { to: "/", label: "Home" },
  { to: "/solutions", label: "Solutions" },
  { to: "/products", label: "Products" },
  { to: "/demo", label: "Demo" },
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
      className={`max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-3 sm:gap-4 ${isDark ? "text-white" : ""}`}
      style={isDark ? { background: "var(--gradient-header-dark)" } : undefined}
    >
      <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="ReadyCheck Lab — Home">
        <img src={logo} alt="ReadyCheck Lab — Measure. Learn. Improve." className="h-16 sm:h-20 md:h-[6.825rem] w-auto" />
      </Link>
      <nav aria-label="Primary" className="hidden md:flex items-center gap-7 text-sm">
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
      <div className="flex items-center gap-2 shrink-0">
        <Link to="/login" className="hidden sm:block" aria-label="Sign in to your account">
          <Button variant="ghost" className={isDark ? "text-white hover:bg-white/10 hover:text-white" : ""}>
            Sign in
          </Button>
        </Link>
        <Link to="/signup" aria-label="Create a new account">
          <Button className="rounded-md bg-primary hover:bg-primary/90 text-primary-foreground">
            Get Started
          </Button>
        </Link>
      </div>
    </header>
  );
}