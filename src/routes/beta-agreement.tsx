import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { LegalDoc } from "@/components/legal-doc";

export const Route = createFileRoute("/beta-agreement")({
  head: () => ({
    meta: [
      { title: "Beta Program Agreement — ReadyCheck Lab" },
      { name: "description", content: "Terms specific to participation in the ReadyCheck Lab public beta — confidentiality, feedback, and acceptable use." },
      { property: "og:title", content: "Beta Program Agreement — ReadyCheck Lab" },
      { property: "og:description", content: "Terms for ReadyCheck Lab public beta participants." },
    ],
  }),
  component: BetaAgreementPage,
});

function BetaAgreementPage() {
  return (
    <MarketingShell
      eyebrow="LEGAL"
      title={<>Beta Program <span className="text-[oklch(0.72_0.2_250)]">Agreement</span></>}
      intro="Additional terms for users participating in the ReadyCheck Lab public beta. Applies in addition to our Terms of Service and Privacy Policy."
    >
      <LegalDoc lastUpdated="May 16, 2026">
        <h2>1. Beta status</h2>
        <p>
          During the public beta, ReadyCheck Lab is provided free of charge while we test the Platform with our first users. Features, scoring outputs, AI behaviors, and pricing are subject to change without notice. Service may be interrupted, reset, or rolled back.
        </p>

        <h2>2. Confidentiality of unreleased features</h2>
        <p>
          As a beta participant, you may see features, screens, internal labels, or admin tooling that have not been publicly announced ("Confidential Information"). You agree:
        </p>
        <ul>
          <li>Not to share screenshots, screen recordings, or detailed descriptions of unreleased features publicly (social media, blog posts, press) without our prior written consent.</li>
          <li>Not to disclose Confidential Information to competitors or to anyone building a similar product.</li>
          <li>To treat the Platform's prompt templates, rubrics, scoring formulas, and admin interfaces as trade secrets.</li>
        </ul>
        <p>This obligation survives termination of your beta participation for two (2) years.</p>

        <h2>3. Feedback</h2>
        <p>
          We actively want your feedback. Any feedback you submit — bug reports, feature requests, ratings, written notes — becomes the property of ReadyCheck Lab and may be used without restriction or compensation. You waive any moral or attribution rights in such feedback.
        </p>

        <h2>4. No benchmarking or competitive use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Platform to build, train, or evaluate a competing product, dataset, or AI model.</li>
          <li>Publish public benchmarks, comparisons, or "vs." articles without our written consent.</li>
          <li>Reverse-engineer scoring outputs to reconstruct our rubrics.</li>
        </ul>

        <h2>5. Data during beta</h2>
        <p>
          During beta we may use anonymized, aggregated usage data and AI outputs to tune prompts, calibrate scoring, and improve the Platform. We will never publish identifiable user data or share your resume, profile, or interview transcripts with third parties beyond the sub-processors listed in our Privacy Policy.
        </p>

        <h2>6. No SLA</h2>
        <p>
          The Platform is provided "AS IS" during beta with no uptime, performance, accuracy, or availability guarantees. Do not rely on it for time-critical hiring, admissions, or compliance decisions during this phase.
        </p>

        <h2>7. Termination</h2>
        <p>
          We may terminate your beta access at any time, especially in cases of suspected scraping, abuse, or breach of confidentiality. You may stop using the Platform at any time and request data deletion.
        </p>

        <h2>8. Transition to paid</h2>
        <p>
          When the beta concludes, we will notify you by email at least 14 days before paid plans take effect. You will not be auto-charged. Continued use after that date will require an explicit subscription.
        </p>

        <h2>9. Acceptance</h2>
        <p>
          By signing up during the beta period, you accept this Agreement together with our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
        </p>
      </LegalDoc>
    </MarketingShell>
  );
}