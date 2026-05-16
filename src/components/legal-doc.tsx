import { ReactNode } from "react";

export function LegalDoc({ children, lastUpdated }: { children: ReactNode; lastUpdated: string }) {
  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-8">
        Last updated: {lastUpdated}
      </p>
      <article
        className="
          text-foreground/90 leading-relaxed
          [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-xl [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-foreground
          [&_h3]:font-display [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mt-6 [&_h3]:mb-2
          [&_p]:my-4 [&_p]:text-[15px]
          [&_ul]:my-4 [&_ul]:pl-6 [&_ul]:list-disc [&_ul]:space-y-2
          [&_ol]:my-4 [&_ol]:pl-6 [&_ol]:list-decimal [&_ol]:space-y-2
          [&_li]:text-[15px]
          [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
          [&_strong]:text-foreground
        "
      >
        {children}
      </article>
    </section>
  );
}