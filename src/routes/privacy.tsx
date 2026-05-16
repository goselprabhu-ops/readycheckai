import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { LegalDoc } from "@/components/legal-doc";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — ReadyCheck Lab" },
      { name: "description", content: "How ReadyCheck Lab collects, uses, stores, and protects your personal data. GDPR and India DPDP compliant." },
      { property: "og:title", content: "Privacy Policy — ReadyCheck Lab" },
      { property: "og:description", content: "How ReadyCheck Lab collects, uses, and protects your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <MarketingShell
      eyebrow="LEGAL"
      title={<>Privacy <span className="text-[oklch(0.72_0.2_250)]">Policy</span></>}
      intro="What we collect, why we collect it, and the control you have over your data. Aligned with GDPR (EU) and DPDP Act (India)."
    >
      <LegalDoc lastUpdated="May 16, 2026">
        <h2>1. Who we are</h2>
        <p>
          ReadyCheck Lab ("we", "us") is the data controller for personal data processed via readychecklab.com and related services. Contact: <a href="mailto:privacy@readychecklab.com">privacy@readychecklab.com</a>.
        </p>

        <h2>2. Data we collect</h2>
        <ul>
          <li><strong>Account data</strong> — name, email, phone number, password hash, role.</li>
          <li><strong>Profile data</strong> — education, work history, skills, target roles, location.</li>
          <li><strong>User content</strong> — resumes, assessment responses, interview transcripts, generated roadmaps.</li>
          <li><strong>Usage data</strong> — feature interactions, AI requests, page views, performance metrics.</li>
          <li><strong>Technical data</strong> — IP address, browser, device, session tokens, error logs.</li>
        </ul>

        <h2>3. How we use it</h2>
        <ul>
          <li>Operate the Platform and personalize your experience.</li>
          <li>Run AI analysis (resume scoring, mock interviews, role readiness, recommendations).</li>
          <li>Provide institutional and recruiter analytics in aggregated, anonymized form.</li>
          <li>Send transactional emails (verification, password reset, important account notices).</li>
          <li>Detect abuse, enforce rate limits, and investigate security incidents.</li>
          <li>Improve the Platform (subject to the limits in Section 7).</li>
        </ul>

        <h2>4. Legal basis (GDPR / DPDP)</h2>
        <ul>
          <li><strong>Contract</strong> — to deliver the services you signed up for.</li>
          <li><strong>Consent</strong> — for optional analytics, marketing email, and AI-feature opt-ins.</li>
          <li><strong>Legitimate interest</strong> — security, fraud prevention, and product improvement.</li>
          <li><strong>Legal obligation</strong> — tax, accounting, and law-enforcement requests.</li>
        </ul>

        <h2>5. Sub-processors</h2>
        <p>We use a small set of trusted vendors to deliver the Platform:</p>
        <ul>
          <li><strong>Lovable Cloud</strong> (managed Postgres, Auth, Storage) — EU/US hosting.</li>
          <li><strong>Lovable AI Gateway</strong> — routed to Google Gemini and OpenAI models for AI features.</li>
          <li><strong>Cloudflare</strong> — edge runtime, DDoS protection.</li>
          <li><strong>Email provider</strong> — transactional email delivery.</li>
        </ul>
        <p>All sub-processors are bound by data-processing agreements. We do not sell personal data.</p>

        <h2>6. Retention</h2>
        <p>
          Account data is retained while your account is active. Resumes and assessment data are retained for 24 months after last activity, then anonymized or deleted. Audit logs (security events) are retained for 12 months. You may request earlier deletion at any time.
        </p>

        <h2>7. AI processing</h2>
        <p>
          Your prompts and content are sent to upstream AI providers (Gemini, OpenAI) under their zero-retention API terms. We do not use your personal content to train third-party models. We may use aggregated, de-identified usage signals to improve our own prompts and rubrics.
        </p>

        <h2>8. Your rights</h2>
        <p>You can:</p>
        <ul>
          <li><strong>Access & export</strong> — download all your data from your profile page ("Export my data").</li>
          <li><strong>Correct</strong> — edit your profile at any time.</li>
          <li><strong>Delete</strong> — request account deletion via <a href="mailto:privacy@readychecklab.com">privacy@readychecklab.com</a>.</li>
          <li><strong>Object / restrict</strong> — opt out of marketing, analytics, or specific AI features.</li>
          <li><strong>Portability</strong> — receive your data in machine-readable JSON.</li>
          <li><strong>Complain</strong> — to your supervisory authority (EU DPA, India DPB) if you believe we mishandled your data.</li>
        </ul>

        <h2>9. Security</h2>
        <p>
          We enforce row-level security on every table, encrypt data in transit (TLS 1.2+) and at rest, log security events, and apply per-user quotas and cooldowns to prevent abuse. See our <a href="/security">Security & Status</a> page for the full posture.
        </p>

        <h2>10. Children</h2>
        <p>
          The Platform is not directed to children under 16. We do not knowingly collect data from children.
        </p>

        <h2>11. International transfers</h2>
        <p>
          Data may be processed outside your country of residence. We rely on Standard Contractual Clauses or equivalent safeguards for cross-border transfers.
        </p>

        <h2>12. Changes</h2>
        <p>
          We may update this Policy. Material changes will be notified by email or in-app banner.
        </p>

        <h2>13. Contact</h2>
        <p>
          Privacy questions: <a href="mailto:privacy@readychecklab.com">privacy@readychecklab.com</a>.
        </p>
      </LegalDoc>
    </MarketingShell>
  );
}