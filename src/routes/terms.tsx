import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { LegalDoc } from "@/components/legal-doc";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — ReadyCheck Lab" },
      { name: "description", content: "Terms governing use of the ReadyCheck Lab platform, including intellectual property, acceptable use, and limitation of liability." },
      { property: "og:title", content: "Terms of Service — ReadyCheck Lab" },
      { property: "og:description", content: "Terms governing use of the ReadyCheck Lab platform." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <MarketingShell
      eyebrow="LEGAL"
      title={<>Terms of <span className="text-[oklch(0.72_0.2_250)]">Service</span></>}
      intro="The rules of engagement between you and ReadyCheck Lab. By using the platform you accept these terms."
    >
      <LegalDoc lastUpdated="May 16, 2026">
        <h2>1. Acceptance</h2>
        <p>
          By accessing or using ReadyCheck Lab ("Platform", "we", "us"), you ("User") agree to be bound by these Terms of Service ("Terms"), our Privacy Policy, and — if you are participating in the public beta — the Beta Program Agreement. If you do not agree, do not use the Platform.
        </p>

        <h2>2. Intellectual Property — Ownership</h2>
        <p className="font-medium">
          All intellectual property, source code, designs, content, workflows, documentation, systems, AI prompts, scoring formulas, rubrics, model configurations, training data, datasets, and derivative works created for or by ReadyCheck Lab shall remain the sole and exclusive property of ReadyCheck Lab.
        </p>
        <p>This includes, without limitation:</p>
        <ul>
          <li><strong>Brand identity</strong> — the marks "ReadyCheck", "ReadyCheck Lab", associated logos, color systems, and visual language.</li>
          <li><strong>Product identity</strong> — feature names, product naming conventions, UI patterns, and product taxonomy.</li>
          <li><strong>Content</strong> — copy, documentation, marketing material, blog posts, presentations, and audio/video assets.</li>
          <li><strong>Technology</strong> — the codebase, architecture, database schemas, APIs, infrastructure design, and deployment pipelines.</li>
          <li><strong>AI workflows</strong> — prompt templates, chain-of-thought patterns, evaluation rubrics, scoring algorithms, and model orchestration logic.</li>
          <li><strong>Source code</strong> — all client and server code, scripts, configuration, and generated artifacts.</li>
          <li><strong>Investor and acquisition value</strong> — goodwill, business methods, and trade secrets embedded in the Platform.</li>
        </ul>
        <p>
          No license, express or implied, is granted to you in any of the foregoing except the limited right to use the Platform as documented.
        </p>

        <h2>3. Prohibited Conduct</h2>
        <p>You agree not to, and not to permit any third party to:</p>
        <ul>
          <li>Copy, reproduce, modify, translate, or create derivative works of any part of the Platform.</li>
          <li>Reverse engineer, decompile, disassemble, or attempt to extract the source code, prompts, or models.</li>
          <li>Scrape, harvest, or systematically extract data, content, questions, rubrics, or AI outputs from the Platform.</li>
          <li>Use the Platform to train, fine-tune, or evaluate any competing AI model, dataset, or product.</li>
          <li>Publicly benchmark, review, or publish comparisons of the Platform without our prior written consent.</li>
          <li>Resell, sublicense, white-label, or otherwise commercialize access to the Platform.</li>
          <li>Circumvent rate limits, quotas, authentication, or any technical protection measure.</li>
          <li>Impersonate any person, institution, recruiter, or use false credentials.</li>
        </ul>

        <h2>4. User Content & Feedback</h2>
        <p>
          You retain ownership of resumes, profile data, and other content you upload ("User Content"). You grant us a worldwide, royalty-free, non-exclusive license to host, process, and analyze User Content solely to operate the Platform and improve its services.
        </p>
        <p>
          Any feedback, suggestions, bug reports, feature requests, or ideas you submit ("Feedback") may be used by us without restriction or compensation, and you irrevocably assign to ReadyCheck Lab all rights, title, and interest in such Feedback.
        </p>

        <h2>5. Beta Disclaimer</h2>
        <p>
          The Platform is currently in public beta. Features may change, break, or be removed without notice. Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, accuracy, or non-infringement.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, ReadyCheck Lab, its officers, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenue, data, or goodwill, arising from your use of or inability to use the Platform. Our aggregate liability for any claim shall not exceed the fees you paid us in the 12 months preceding the claim (or INR 1,000, whichever is greater).
        </p>

        <h2>7. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless ReadyCheck Lab against any claims, damages, or expenses arising from your breach of these Terms or misuse of the Platform.
        </p>

        <h2>8. Termination</h2>
        <p>
          We may suspend or terminate your account at any time for breach of these Terms, suspected fraud, or to protect the Platform. Sections 2, 4, 6, 7, and 9 survive termination.
        </p>

        <h2>9. Governing Law</h2>
        <p>
          These Terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.
        </p>

        <h2>10. Changes</h2>
        <p>
          We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance.
        </p>

        <h2>11. Contact</h2>
        <p>
          Questions about these Terms: <a href="mailto:legal@readychecklab.com">legal@readychecklab.com</a>.
        </p>
      </LegalDoc>
    </MarketingShell>
  );
}