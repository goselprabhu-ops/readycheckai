import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card" role="contentinfo">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
        <div>
          <div className="font-display font-bold text-lg">ReadyCheck Lab</div>
          <p className="text-sm text-muted-foreground mt-2">Measure. Learn. Improve.</p>
          <p className="text-xs text-muted-foreground mt-4">
            AI-powered readiness intelligence for learners, educators, and institutions.
          </p>
        </div>
        <nav aria-label="Platform">
          <div className="font-semibold text-sm mb-3">Platform</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/solutions" className="hover:text-foreground">Solutions</Link></li>
            <li><Link to="/products" className="hover:text-foreground">Products</Link></li>
            <li><Link to="/research" className="hover:text-foreground">Research</Link></li>
          </ul>
        </nav>
        <nav aria-label="Company">
          <div className="font-semibold text-sm mb-3">Company</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            <li><Link to="/security" className="hover:text-foreground">Security & Status</Link></li>
          </ul>
        </nav>
        <nav aria-label="Get started">
          <div className="font-semibold text-sm mb-3">Get Started</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/signup" className="hover:text-foreground">Create account</Link></li>
            <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <div className="font-semibold text-sm mb-3">Legal</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/terms" className="hover:text-foreground">Terms of Service</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
            <li><Link to="/beta-agreement" className="hover:text-foreground">Beta Agreement</Link></li>
            <li><Link to="/ip-notice" className="hover:text-foreground">IP Notice</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border py-5 px-4 text-center text-xs text-muted-foreground break-words">
        © {new Date().getFullYear()} ReadyCheck Lab. All rights reserved. All intellectual property, source code, designs, content, workflows, and derivative works are the sole property of ReadyCheck Lab.
      </div>
    </footer>
  );
}