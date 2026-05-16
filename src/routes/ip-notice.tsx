import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { LegalDoc } from "@/components/legal-doc";

export const Route = createFileRoute("/ip-notice")({
  head: () => ({
    meta: [
      { title: "IP & Confidentiality Notice — ReadyCheck Lab" },
      { name: "description", content: "ReadyCheck Lab's intellectual property, trade secret, and confidentiality notice for investors, partners, and institutional reviewers." },
      { property: "og:title", content: "IP & Confidentiality Notice — ReadyCheck Lab" },
      { property: "og:description", content: "ReadyCheck Lab IP, trade secret, and confidentiality notice." },
    ],
  }),
  component: IpNoticePage,
});

function IpNoticePage() {
  return (
    <MarketingShell
      eyebrow="LEGAL"
      title={<>IP & Confidentiality <span className="text-[oklch(0.72_0.2_250)]">Notice</span></>}
      intro="A standing notice covering ownership of all IP, trade secrets, and confidential materials produced by ReadyCheck Lab. Linkable from investor decks, recruiter demos, and institutional pilots."
    >
      <LegalDoc lastUpdated="May 16, 2026">
        <h2>1. Ownership statement</h2>
        <p className="font-medium">
          All intellectual property, source code, designs, content, workflows, documentation, systems, AI prompts, scoring formulas, rubrics, model configurations, datasets, and derivative works created for or by ReadyCheck Lab shall remain the sole and exclusive property of ReadyCheck Lab.
        </p>
        <p>This notice covers, without limitation:</p>
        <ul>
          <li><strong>Brand identity</strong> — the marks "ReadyCheck", "ReadyCheck Lab", logos, wordmarks, color systems, typographic systems, and brand voice.</li>
          <li><strong>Product identity</strong> — feature names, product modules, UI patterns, naming conventions, taxonomy, and information architecture.</li>
          <li><strong>Content</strong> — marketing copy, documentation, product documents, executive summaries, pitch decks, blog posts, videos, and audio.</li>
          <li><strong>Technology</strong> — codebase, database schemas, APIs, edge functions, deployment pipelines, observability tooling, and infrastructure design.</li>
          <li><strong>AI workflows</strong> — prompt templates, chain-of-thought patterns, scoring algorithms, evaluation rubrics, model selection logic, fallback strategies, and orchestration code.</li>
          <li><strong>Source code</strong> — frontend, server functions, server routes, database migrations, scripts, and all generated artifacts.</li>
          <li><strong>Trade secrets</strong> — unreleased features, internal benchmarks, customer pipeline, pricing strategy, and product roadmap.</li>
          <li><strong>Investor value</strong> — financials, traction metrics, projections, and cap-table information.</li>
          <li><strong>Acquisition value</strong> — goodwill, business methods, customer relationships, and contractual rights.</li>
        </ul>

        <h2>2. Trade secret status</h2>
        <p>
          The following items are designated trade secrets of ReadyCheck Lab and are protected under applicable law (India Trade Secrets framework, US Defend Trade Secrets Act, EU Directive 2016/943):
        </p>
        <ul>
          <li>AI prompt templates and chain-of-thought patterns.</li>
          <li>Scoring formulas, weighting schemes, and evaluation rubrics.</li>
          <li>Resume parsing pipeline, OCR fallback logic, and quality heuristics.</li>
          <li>Role-readiness composite engine and benchmarks.</li>
          <li>Admin tooling, observability dashboards, and internal metrics.</li>
          <li>Customer lists, institutional pilots, and recruiter pipeline.</li>
        </ul>

        <h2>3. Confidentiality of shared materials</h2>
        <p>
          Any document, deck, screen recording, demo, executive summary, technical write-up, or recorded conversation shared by ReadyCheck Lab with investors, partners, recruiters, institutions, advisors, or evaluators is provided strictly for the recipient's internal evaluation. The recipient agrees:
        </p>
        <ul>
          <li>Not to copy, distribute, post, publish, or share with third parties without prior written consent.</li>
          <li>Not to use the materials for any purpose other than evaluating a potential commercial or investment relationship.</li>
          <li>To return or destroy the materials on request.</li>
          <li>To treat them as confidential for a minimum of three (3) years from receipt.</li>
        </ul>
        <p>
          Acceptance of any ReadyCheck Lab document or demo constitutes acceptance of this notice.
        </p>

        <h2>4. Trademarks</h2>
        <p>
          "ReadyCheck", "ReadyCheck Lab", and associated logos are trademarks of ReadyCheck Lab. No use, registration, or imitation is permitted without prior written consent.
        </p>

        <h2>5. Reservation of rights</h2>
        <p>
          All rights not expressly granted by ReadyCheck Lab are reserved. Nothing in any communication, demo, or shared document shall be construed as a license, assignment, or transfer of intellectual property.
        </p>

        <h2>6. Enforcement</h2>
        <p>
          ReadyCheck Lab will pursue all available legal and equitable remedies — including injunction and damages — against any unauthorized use, disclosure, or misappropriation of its intellectual property or trade secrets.
        </p>

        <h2>7. Contact</h2>
        <p>
          IP, licensing, and confidentiality inquiries: <a href="mailto:legal@readychecklab.com">legal@readychecklab.com</a>.
        </p>
      </LegalDoc>
    </MarketingShell>
  );
}