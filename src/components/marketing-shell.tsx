import { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export function MarketingShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="text-white" style={{ background: "var(--gradient-hero)" }}>
        <SiteHeader variant="dark" />
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-20">
          <span className="inline-block px-3 py-1 rounded-md border border-white/20 bg-white/5 text-[11px] font-semibold tracking-wider text-white/90">
            {eyebrow}
          </span>
          <h1 className="mt-5 font-display font-bold tracking-tight text-4xl md:text-5xl lg:text-6xl leading-[1.1] max-w-3xl">
            {title}
          </h1>
          {intro && <p className="mt-5 text-lg text-white/75 max-w-2xl">{intro}</p>}
        </div>
      </div>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}