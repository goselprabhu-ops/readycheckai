import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="font-display font-bold text-lg">ReadyCheck Lab</div>
          <p className="text-sm text-muted-foreground mt-2">Measure. Learn. Improve.</p>
          <p className="text-xs text-muted-foreground mt-4">
            AI-powered readiness intelligence for learners, educators, and institutions.
          </p>
        </div>
        <div>
          <div className="font-semibold text-sm mb-3">Platform</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/solutions" className="hover:text-foreground">Solutions</Link></li>
            <li><Link to="/products" className="hover:text-foreground">Products</Link></li>
            <li><Link to="/research" className="hover:text-foreground">Research</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-sm mb-3">Company</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-sm mb-3">Get Started</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/signup" className="hover:text-foreground">Create account</Link></li>
            <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ReadyCheck Lab — Measure. Learn. Improve.
      </div>
    </footer>
  );
}