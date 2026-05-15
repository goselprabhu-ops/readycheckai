import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageOrientation, LevelFormat, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, PageBreak, Header, Footer, PageNumber } from "docx";
import fs from "fs";

const FONT = "Calibri";
const PRIMARY = "1E3A8A";
const MUTED = "475569";
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" };
const CELL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

const styles = {
  default: { document: { run: { font: FONT, size: 22 } } },
  paragraphStyles: [
    { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 56, bold: true, font: FONT, color: PRIMARY },
      paragraph: { spacing: { before: 0, after: 120 } } },
    { id: "Subtitle", name: "Subtitle", basedOn: "Normal", next: "Normal",
      run: { size: 26, font: FONT, color: MUTED, italics: true },
      paragraph: { spacing: { before: 0, after: 360 } } },
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 36, bold: true, font: FONT, color: PRIMARY },
      paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 28, bold: true, font: FONT, color: "0F172A" },
      paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 24, bold: true, font: FONT, color: "0F172A" },
      paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
  ],
};

const numbering = {
  config: [
    { reference: "bullets", levels: [
      { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
    ]},
    { reference: "n1", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]},
    { reference: "n2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]},
    { reference: "n3", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]},
    { reference: "n4", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]},
    { reference: "n5", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]},
    { reference: "n6", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]},
    { reference: "n7", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]},
    { reference: "n8", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]},
    { reference: "n9", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]},
    { reference: "n10", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]},
    { reference: "n11", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]},
    { reference: "n12", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]},
  ],
};

const P = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 120 } });
const H1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const H2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const H3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
const Bullet = (text, level = 0) => new Paragraph({ numbering: { reference: "bullets", level }, children: [new TextRun(text)], spacing: { after: 60 } });
let __numCur = 0, __numLastIdx = -100; const NUM_REF = () => "n" + __numCur; const Num = (text) => { /* caller bumps via NumStart */ return new Paragraph({ numbering: { reference: NUM_REF(), level: 0 }, children: [new TextRun(text)], spacing: { after: 60 } }); }; const NumStart = () => { __numCur = (__numCur % 12) + 1; return null; }; return (text) => new Paragraph({ numbering: { reference: "n" + __numIdx, level: 0 }, children: [new TextRun(text)], spacing: { after: 60 } }); };
const Spacer = () => new Paragraph({ children: [new TextRun("")] });
const Code = (text) => new Paragraph({
  children: [new TextRun({ text, font: "Consolas", size: 20 })],
  shading: { type: ShadingType.CLEAR, fill: "F1F5F9" },
  spacing: { after: 120, before: 60 },
});

function makeTable(headers, rows) {
  const totalWidth = 9360;
  const colWidth = Math.floor(totalWidth / headers.length);
  const widths = headers.map(() => colWidth);
  const cell = (text, opts = {}) => new TableCell({
    borders: CELL_BORDERS,
    width: { size: colWidth, type: WidthType.DXA },
    shading: opts.header ? { fill: "E0E7FF", type: ShadingType.CLEAR } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: !!opts.header, size: 20 })] })],
  });
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h) => cell(h, { header: true })) }),
      ...rows.map((r) => new TableRow({ children: r.map((c) => cell(c)) })),
    ],
  });
}

const titleBlock = (title, subtitle) => [
  new Paragraph({ style: "Title", children: [new TextRun(title)] }),
  new Paragraph({ style: "Subtitle", children: [new TextRun(subtitle)] }),
  new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: PRIMARY, space: 4 } },
    children: [new TextRun("")],
    spacing: { after: 240 },
  }),
];

const meta = (rows) => makeTable(["Field", "Value"], rows);

function buildDoc(title, sections, footerText) {
  return new Document({
    styles, numbering,
    creator: "ReadyCheck Lab",
    title,
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({ children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "ReadyCheck Lab \u2014 " + footerText, size: 18, color: MUTED })],
        })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Page ", size: 18, color: MUTED }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: MUTED }),
            new TextRun({ text: " of ", size: 18, color: MUTED }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: MUTED }),
          ],
        })] }),
      },
      children: sections.filter(Boolean),
    }],
  });
}

// =============== DOC 1: MVP Document ===============
const mvpDoc = buildDoc("ReadyCheck Lab — MVP Document", [
  ...titleBlock("ReadyCheck Lab", "MVP Document \u2014 Currently Shipped Product"),

  H1("1. Document Purpose"),
  P("This document describes the Minimum Viable Product (MVP) of ReadyCheck Lab as currently deployed in production. It captures the product positioning, the modules that are live, the technical architecture, and the operational guarantees that backstop them. It is the source of truth for stakeholders evaluating the platform before further Version 1 expansion."),
  Spacer(),
  meta([
    ["Product", "ReadyCheck Lab"],
    ["Stage", "MVP \u2014 Production"],
    ["Production URL", "https://readychecklab.com"],
    ["Audience", "Aspiring data analytics professionals, colleges, recruiters"],
    ["Document version", "1.0"],
  ]),

  H1("2. Product Positioning"),
  P("ReadyCheck Lab is an AI-assisted employability assessment platform focused on the analytics career track. It helps users measure their job-readiness, identify skill gaps, and follow personalized improvement guidance backed by transparent scoring."),
  H2("2.1 Core Value Propositions"),
  Bullet("Objective readiness scoring across SQL, Python, and Resume pillars"),
  Bullet("AI-powered resume analysis with OCR fallback for scanned documents"),
  Bullet("Adaptive recommendations and an AI-generated learning roadmap"),
  Bullet("Mock interview practice with an AI interviewer"),
  Bullet("Privacy-respecting telemetry, audit log, and one-click data export"),

  H1("3. Shipped Modules"),
  H2("3.1 Authentication & Onboarding"),
  Bullet("Email/password sign-up with email verification"),
  Bullet("Google social sign-in"),
  Bullet("Optional phone OTP verification"),
  Bullet("Multi-step onboarding capturing name, target role, education, and interests"),
  Bullet("Password reset and email change flows with branded transactional emails"),

  H2("3.2 Assessments"),
  Bullet("SQL track \u2014 multiple-choice questions, server-validated"),
  Bullet("Python track \u2014 multiple-choice questions, server-validated"),
  Bullet("Per-question scoring stored in the audit-protected scores table"),
  Bullet("Attempt history with completion timestamps and expiry"),
  Bullet("Question secrets isolated from the questions table (no client leak)"),

  H2("3.3 Resume Intelligence"),
  Bullet("PDF upload (10 MB limit) with virus-scanned storage path"),
  Bullet("Text-based PDF extraction"),
  Bullet("OCR fallback (Gemini 2.5 Pro via Lovable AI Gateway) for scanned PDFs"),
  Bullet("AI analysis: ATS score, strengths, gaps, suggestions, keyword extraction"),
  Bullet("Extraction confidence and parser status surfaced to the user"),
  Bullet("Low-confidence advisory when OCR is used"),

  H2("3.4 Readiness Engine"),
  P("Pure, isomorphic readiness model with the following pipeline:"),
  Code("pillar scores \u2192 recency decay \u2192 role-weighted average \u2192 completeness multiplier \u2192 normalization \u2192 level + confidence + percentile"),
  Bullet("Levels: Beginner, Intermediate, Interview Ready, Advanced"),
  Bullet("Role profile defaults to Data Analyst (configurable per role)"),
  Bullet("Trend detection over the last five readiness snapshots"),
  Bullet("Confidence score reflecting recency and sample volume"),

  H2("3.5 Recommendations & Roadmap"),
  Bullet("Rule-based recommendation generator with priority and category"),
  Bullet("Triggers include low SQL/Python/Resume scores, missing Power BI, sparse portfolio"),
  Bullet("AI-generated adaptive roadmap with status tracking (pending / in progress / done)"),
  Bullet("Per-item time estimates and ordered weekly progression"),

  H2("3.6 Mock Interview"),
  Bullet("Free-form chat with an AI interviewer"),
  Bullet("Role-aware opening prompt (default: Data Analyst)"),
  Bullet("Per-session message persistence under user-scoped RLS"),

  H2("3.7 Profile & Portfolio"),
  Bullet("Editable profile: headline, education, experience, projects, certifications, languages, achievements"),
  Bullet("Avatar upload, social links (LinkedIn, GitHub, portfolio)"),
  Bullet("Profile completion indicator"),

  H2("3.8 Admin & Trust Surface"),
  Bullet("Admin route gated by has_role(auth.uid(), 'admin')"),
  Bullet("Audit log viewer (system + security events with severity badges)"),
  Bullet("Public Security & Status page with live API/DB health polling"),
  Bullet("GDPR/DPDP self-service data export (JSON of 15 user-owned tables)"),

  H1("4. Technical Architecture"),
  meta([
    ["Frontend framework", "TanStack Start v1 + React 19"],
    ["Build tool", "Vite 7"],
    ["Runtime", "Cloudflare Workers (Edge)"],
    ["Styling", "Tailwind CSS v4 + shadcn/ui"],
    ["Backend", "Lovable Cloud (managed Postgres + Auth + Storage)"],
    ["Server logic", "TanStack createServerFn (server-fn RPC)"],
    ["AI provider", "Lovable AI Gateway (Gemini 2.5 family)"],
    ["Auth", "Email/password + Google OAuth + Phone OTP"],
    ["Observability", "system_events, security_events, web-vitals beacon"],
  ]),

  H2("4.1 Security Posture"),
  Bullet("Row-Level Security on every user-owned table"),
  Bullet("SECURITY DEFINER RPCs locked down to service_role"),
  Bullet("HIBP password breach check enforced at sign-up"),
  Bullet("Roles stored in user_roles (never on profiles) to prevent privilege escalation"),
  Bullet("Audit trail for security-sensitive actions (sign-in, role grant, data export)"),

  H2("4.2 Operational Observability"),
  Bullet("Web Vitals (LCP, INP, CLS) beaconed to /api/public/web-vitals"),
  Bullet("Client error reporter de-duplicates and posts to /api/public/client-errors"),
  Bullet("Health endpoints: /api/public/health and /api/public/health/email-queue"),
  Bullet("Cron-driven cleanup of failed resume analyses (weekly)"),

  H1("5. Public & Authenticated Surfaces"),
  makeTable(["Surface", "Route", "Audience"], [
    ["Landing", "/", "Public"],
    ["Products / Solutions / Research / About / Contact", "/products, /solutions, /research, /about, /contact", "Public"],
    ["Security & Status", "/security", "Public"],
    ["Sign-in / Sign-up / Reset", "/login, /signup, /forgot-password, /reset-password", "Public"],
    ["Dashboard", "/dashboard", "Authenticated"],
    ["Onboarding", "/onboarding", "Authenticated (first run)"],
    ["Assessment", "/assessment", "Authenticated"],
    ["Resume", "/resume", "Authenticated"],
    ["Progress", "/progress", "Authenticated"],
    ["Roadmap", "/roadmap", "Authenticated"],
    ["Mock Interview", "/interview", "Authenticated"],
    ["Profile", "/profile", "Authenticated"],
    ["Admin", "/admin", "Admin role only"],
  ]),

  H1("6. MVP Scope Boundaries"),
  P("The following capabilities are part of the Version 1 plan but are NOT in scope for the current MVP:"),
  Bullet("Per-role match percentages (Data Analyst / BI / Business / Jr Data Scientist)"),
  Bullet("ATS sub-scores (keyword / formatting / readability separated)"),
  Bullet("AI rewrite suggestions for resume bullets and summaries"),
  Bullet("Power BI, Excel, and Statistics assessment tracks"),
  Bullet("Structured rubric scoring inside mock interviews"),
  Bullet("Public readiness profile pages and achievement badges"),
  Bullet("College and recruiter dashboards (currently stub pages)"),
  Bullet("Subscription billing (Stripe)"),
  Bullet("Live market intelligence feeds (only seed data today)"),

  H1("7. Success Indicators (MVP)"),
  Bullet("Assessment completion rate"),
  Bullet("Resume analysis success rate (parser_status = ok or ocr_ok)"),
  Bullet("Readiness score progression across attempts"),
  Bullet("Roadmap item completion rate"),
  Bullet("Repeat sessions per active user"),

  H1("8. Document Control"),
  meta([
    ["Owner", "ReadyCheck Lab Product"],
    ["Last updated", new Date().toISOString().slice(0, 10)],
    ["Status", "Live MVP \u2014 prerequisite for Version 1 build"],
    ["Companion docs", "User Manual, Tester Guide"],
  ]),
], "MVP Document");

// =============== DOC 2: User Manual ===============
const userDoc = buildDoc("ReadyCheck Lab — User Manual", [
  ...titleBlock("ReadyCheck Lab", "User Manual \u2014 Getting Started & Daily Use"),

  H1("1. Welcome"),
  P("ReadyCheck Lab helps you measure your job-readiness for analytics roles, find your skill gaps, and improve them with AI-powered guidance. This manual walks you through every screen you will use as a learner."),
  P("You can access the platform at https://readychecklab.com on any modern browser \u2014 desktop or mobile."),

  H1("2. Creating Your Account"),
  NumStart(),
  Num("Visit https://readychecklab.com and click \u201CSign up\u201D in the top right."),
  Num("Choose either email + password, or \u201CContinue with Google\u201D."),
  Num("If you used email, check your inbox for the verification link and click it."),
  Num("You will land on the onboarding screen automatically once verified."),
  P("Tip: passwords are checked against the HaveIBeenPwned breach database. If your password has been exposed in a known leak, you\u2019ll be asked to choose another."),

  H1("3. Onboarding (First-Run Setup)"),
  P("The onboarding flow takes about two minutes and unlocks the rest of the product. You will be asked for:"),
  Bullet("Full name and headline (e.g. \u201CFinal-year B.Tech, aspiring Data Analyst\u201D)"),
  Bullet("Target role (Data Analyst is the default)"),
  Bullet("College / institution and year"),
  Bullet("Areas of interest (e.g. dashboards, statistics, machine learning)"),
  P("You can edit any of this later from the Profile page."),

  H1("4. The Dashboard"),
  P("After onboarding, you land on the Dashboard. It is your control center."),
  H2("4.1 Readiness Ring"),
  P("The large circular score is your overall readiness percentage (0\u2013100), color-coded by level:"),
  makeTable(["Level", "Score range", "Meaning"], [
    ["Beginner", "0\u201349", "Foundational gaps; focus on the basics"],
    ["Intermediate", "50\u201369", "Working knowledge; deepen and broaden"],
    ["Interview Ready", "70\u201384", "Apply for roles; refine weak spots"],
    ["Advanced", "85\u2013100", "Strong candidate; aim for top employers"],
  ]),
  H2("4.2 Pillar Cards"),
  P("Underneath the ring you\u2019ll see three cards \u2014 SQL, Python, and Resume. Each shows the latest score and the date the score was last computed. Older scores decay slightly to keep the overall reading current."),
  H2("4.3 Recommendations Panel"),
  P("Personalized actions sorted by priority. Tap any item to navigate to the matching screen (Assessment, Resume, Roadmap)."),

  H1("5. Taking an Assessment"),
  NumStart(),
  Num("Click \u201CAssessment\u201D in the sidebar."),
  Num("Choose a track \u2014 SQL or Python."),
  Num("Answer the multiple-choice questions one at a time."),
  Num("On the last question, click \u201CSubmit\u201D. You\u2019ll see your score, breakdown, and a summary."),
  P("Your score is recorded in your readiness history and the recommendations engine refreshes automatically."),
  P("You can retake an assessment at any time. Only your most recent score counts toward your readiness, but trend information uses the full history."),

  H1("6. Uploading Your Resume"),
  NumStart(),
  Num("Click \u201CResume\u201D in the sidebar."),
  Num("Drop or pick a PDF file. Maximum size is 10 MB."),
  Num("The platform extracts text and runs an AI analysis. This typically takes 5\u201320 seconds."),
  Num("Review your ATS score, strengths, gaps, suggestions, and detected keywords."),
  P("If your PDF is a scan (image-only), the platform will fall back to OCR and show an \u201COCR + AI\u201D badge along with an extraction-confidence percentage. Low confidence means accuracy may suffer \u2014 re-export your resume from Word or Google Docs as a text-based PDF for the best results."),
  H2("6.1 Status Messages"),
  makeTable(["Status", "What it means", "What to do"], [
    ["ok", "Resume parsed successfully", "Review the analysis"],
    ["ocr_ok", "Scanned PDF read with OCR", "Consider uploading a text-based PDF"],
    ["empty_extraction", "Too little text detected", "Re-export and try again"],
    ["image_only_pdf", "Pure image scan we cannot read", "Upload a text-based PDF"],
    ["malformed_pdf", "Corrupted file", "Re-export from your editor"],
    ["oversized", "File over 10 MB", "Compress and retry"],
  ]),

  H1("7. The Adaptive Roadmap"),
  NumStart(),
  Num("Click \u201CRoadmap\u201D in the sidebar."),
  Num("Enter your target role and click \u201CGenerate\u201D."),
  Num("The AI builds an ordered list of items with time estimates."),
  Num("Click the circle on the left of any item to cycle its status: pending \u2192 in progress \u2192 done."),
  P("Re-generate the roadmap whenever you complete an assessment or upload a new resume \u2014 it will reflect your latest gaps."),

  H1("8. Mock Interview"),
  NumStart(),
  Num("Click \u201CMock Interview\u201D in the sidebar."),
  Num("Confirm or edit your target role and click \u201CStart interview\u201D."),
  Num("The AI interviewer asks you a question; type your answer and press Enter (Shift+Enter for a new line)."),
  Num("Continue the conversation as long as you like. Your transcript is saved to your account."),
  P("Tip: treat each session as if it were real. Speak in full sentences, use specific examples, and quantify outcomes when you can."),

  H1("9. Your Profile & Portfolio"),
  P("Open Profile from the sidebar to maintain your professional record:"),
  Bullet("Personal: full name, photo, location, date of birth, phone"),
  Bullet("Links: LinkedIn, GitHub, portfolio"),
  Bullet("Summary: a 2\u20133 sentence elevator pitch"),
  Bullet("Sections: education, experience, projects, certifications, languages, achievements"),
  P("Click \u201CExport my data\u201D at the bottom of the Profile page to download a JSON copy of everything we hold about you (GDPR / DPDP self-service)."),

  H1("10. Privacy, Security & Your Data"),
  Bullet("Your data is encrypted at rest and in transit"),
  Bullet("Each account can only see its own records (Row-Level Security)"),
  Bullet("Sensitive operations are logged to an admin-only audit trail"),
  Bullet("You can export your data at any time"),
  Bullet("Deletion requests can be raised from the Contact page"),
  P("For a live system status snapshot, visit https://readychecklab.com/security."),

  H1("11. Troubleshooting"),
  makeTable(["Symptom", "Likely cause", "Fix"], [
    ["Verification email not received", "Greylisted by your provider", "Check spam, then request a new link from /login"],
    ["Resume stuck at \u201CProcessing\u201D", "Large or scanned PDF", "Wait up to 60s; if it fails, re-export as text PDF"],
    ["Readiness score not updating", "Cached snapshot", "Refresh the dashboard; new score appears on next attempt"],
    ["Mock interview won\u2019t start", "AI Gateway rate limit", "Wait a minute and click Start again"],
    ["Cannot sign in with Google", "Browser blocking third-party cookies", "Allow cookies for accounts.google.com"],
  ]),

  H1("12. Getting Help"),
  P("Open the Contact page (\u201CContact\u201D in the footer) to send us a message. Include your account email and a screenshot of the issue if possible. We typically respond within one working day."),
], "User Manual");

// =============== DOC 3: Tester Guide ===============
const testerDoc = buildDoc("ReadyCheck Lab — Tester Guide", [
  ...titleBlock("ReadyCheck Lab", "Tester Guide \u2014 MVP QA Playbook"),

  H1("1. Purpose"),
  P("This guide is for QA engineers and pilot testers validating the ReadyCheck Lab MVP. It defines the test environments, the smoke-path matrix, the regression scenarios per module, and the acceptance criteria each release must satisfy before promotion."),

  H1("2. Environments"),
  meta([
    ["Production", "https://readychecklab.com"],
    ["Preview", "https://id-preview--f3f78afd-a71b-4a39-9a1f-560bc5f0c3e1.lovable.app"],
    ["Stable preview alias", "project--f3f78afd-a71b-4a39-9a1f-560bc5f0c3e1-dev.lovable.app"],
    ["Stable production alias", "project--f3f78afd-a71b-4a39-9a1f-560bc5f0c3e1.lovable.app"],
  ]),
  P("Always run smoke tests on the preview alias before signing off a release for production promotion."),

  H1("3. Test Accounts"),
  P("Create at least three accounts per regression cycle:"),
  Bullet("Fresh learner \u2014 brand new, no resume, no scores"),
  Bullet("Mid-funnel learner \u2014 onboarded, one assessment attempt, one resume"),
  Bullet("Power user \u2014 multiple assessments, OCR resume, completed roadmap items"),
  Bullet("Admin \u2014 must have a row in user_roles with role='admin'"),
  P("Use plus-addressing on a single inbox (e.g. qa+fresh@example.com) to keep accounts isolated but reachable."),

  H1("4. Smoke Path (Must Pass Every Build)"),
  NumStart(),
  Num("Visit / and confirm landing renders without console errors"),
  Num("Sign up with a new email; receive verification email; click the link"),
  Num("Complete onboarding in full"),
  Num("Take one SQL assessment end-to-end; see score on the dashboard"),
  Num("Upload a text-based PDF resume; see ATS score and suggestions"),
  Num("Generate a roadmap; cycle one item to \u201Cdone\u201D"),
  Num("Start a mock interview; send and receive at least two messages"),
  Num("Open Profile and export data; verify JSON downloads"),
  Num("Sign out and sign back in"),
  P("If any step fails, the build is blocked from promotion."),

  H1("5. Module-Level Test Cases"),

  H2("5.1 Authentication"),
  makeTable(["#", "Scenario", "Expected"], [
    ["A1", "Sign up with weak password (e.g. password123)", "Rejected with HIBP message"],
    ["A2", "Sign up with strong password", "Verification email sent"],
    ["A3", "Click verification link", "Redirected to /onboarding"],
    ["A4", "Sign in with wrong password", "Generic auth error, no account enumeration"],
    ["A5", "Forgot password flow", "Reset email arrives within 60s; new password works"],
    ["A6", "Google OAuth sign-in", "Lands on /dashboard or /onboarding"],
    ["A7", "Phone OTP verification", "OTP arrives, 6 digits, expires in 10 min"],
  ]),

  H2("5.2 Onboarding"),
  makeTable(["#", "Scenario", "Expected"], [
    ["O1", "Skip a required field", "Inline validation; cannot proceed"],
    ["O2", "Complete onboarding", "profiles.onboarded = true; redirected to /dashboard"],
    ["O3", "Revisit /onboarding after completion", "Pre-filled with existing values"],
  ]),

  H2("5.3 Assessments"),
  makeTable(["#", "Scenario", "Expected"], [
    ["S1", "Start SQL attempt", "Row in assessment_attempts with status='in_progress'"],
    ["S2", "Submit all answers", "Row updated to 'completed'; per-question rows in scores"],
    ["S3", "Refresh mid-attempt", "Progress preserved; can resume"],
    ["S4", "Inspect questions table from client", "No correct_answer field returned (in question_secrets, RLS-denied)"],
    ["S5", "Take Python attempt", "Independent score; readiness recomputed"],
  ]),

  H2("5.4 Resume Pipeline"),
  makeTable(["#", "Scenario", "Expected", "Status"], [
    ["R1", "Upload text-based PDF", "parser_status='ok'; AI analysis returns", "method='ai'"],
    ["R2", "Upload scanned PDF", "OCR fallback runs; badge shows OCR + AI", "parser_status='ocr_ok'"],
    ["R3", "Upload corrupted PDF", "Friendly error; no row created", "parser_status='malformed_pdf'"],
    ["R4", "Upload 12 MB file", "Rejected client-side", "parser_status='oversized'"],
    ["R5", "Upload .docx file", "Rejected with format message", "parser_status='unsupported'"],
    ["R6", "Re-upload same resume", "New row in resume_analyses; old retained", "history preserved"],
  ]),

  H2("5.5 Readiness Engine"),
  makeTable(["#", "Scenario", "Expected"], [
    ["E1", "Take only SQL assessment", "Readiness reflects completeness < 1.0"],
    ["E2", "Add Python and Resume", "Completeness = 1.0; readiness rises"],
    ["E3", "Wait 90+ days simulated", "Recency factor halves; readiness falls"],
    ["E4", "Five rising scores", "Trend = 'rising'; trend boost applied"],
    ["E5", "Confidence value", "Between 0 and 1; rises with samples"],
  ]),

  H2("5.6 Roadmap"),
  makeTable(["#", "Scenario", "Expected"], [
    ["RM1", "Generate roadmap (Data Analyst)", "Items returned with order_index and est_minutes"],
    ["RM2", "Cycle item status", "pending \u2192 in_progress \u2192 done \u2192 pending"],
    ["RM3", "Re-generate", "New items replace old; user_id scoped"],
  ]),

  H2("5.7 Mock Interview"),
  makeTable(["#", "Scenario", "Expected"], [
    ["I1", "Start session", "Opening message stored under user_id"],
    ["I2", "Send rapid messages", "Rate-limited gracefully (no error toast spam)"],
    ["I3", "Refresh page", "History rehydrates from interview_messages"],
    ["I4", "Inject prompt-injection content", "AI guardrails strip / refuse"],
  ]),

  H2("5.8 Admin Surface"),
  makeTable(["#", "Scenario", "Expected"], [
    ["AD1", "Open /admin without admin role", "Redirected; access denied"],
    ["AD2", "Open /admin with admin role", "Audit log card renders with severity badges"],
    ["AD3", "Manage questions", "CRUD only available to admins"],
  ]),

  H1("6. Cross-Cutting Checks"),

  H2("6.1 Accessibility"),
  Bullet("All interactive elements reachable via keyboard (Tab / Shift+Tab)"),
  Bullet("Focus rings visible on every focusable element"),
  Bullet("Screen reader announces page titles and form labels"),
  Bullet("Color contrast \u2265 4.5:1 for body text in light and dark mode"),
  Bullet("No serious or critical axe-core violations"),

  H2("6.2 Performance"),
  Bullet("LCP < 2.5s on a cold cache (Fast 3G profile)"),
  Bullet("INP < 200ms on dashboard interactions"),
  Bullet("CLS < 0.1"),
  Bullet("Main JS chunk < 350 KB gzipped"),

  H2("6.3 Security"),
  Bullet("supabase--linter returns zero blocking issues"),
  Bullet("security--run_security_scan returns zero blocking issues"),
  Bullet("RLS denies cross-user reads (verify with two accounts)"),
  Bullet("question_secrets table returns nothing to authenticated users"),
  Bullet("system_events / security_events visible only to admins"),

  H2("6.4 Observability"),
  Bullet("Web vitals beacon visible in /api/public/web-vitals network log"),
  Bullet("Throwing a test client error reaches /api/public/client-errors"),
  Bullet("/api/public/health returns 200 with latency_ms field"),

  H1("7. Bug Reporting Template"),
  Code("Title: <one-line summary>\nEnvironment: production | preview\nAccount: <email>\nRoute: <e.g. /resume>\nSteps: 1. ... 2. ... 3. ...\nExpected: ...\nActual: ...\nConsole errors: <paste>\nNetwork failures: <paste>\nScreenshot / video: <link>\nSeverity: blocker | major | minor | cosmetic"),

  H1("8. Severity Definitions"),
  makeTable(["Severity", "Definition", "Action"], [
    ["Blocker", "Smoke path fails or data loss", "Stop release; hotfix"],
    ["Major", "Module unusable for a real user", "Fix before next promotion"],
    ["Minor", "Workaround exists; minor friction", "Schedule for next sprint"],
    ["Cosmetic", "Visual / copy issue, no functional impact", "Backlog"],
  ]),

  H1("9. Sign-Off Checklist"),
  Bullet("Smoke path green on preview"),
  Bullet("All blocker and major bugs from previous cycle closed"),
  Bullet("Accessibility scan clean"),
  Bullet("Performance budgets met"),
  Bullet("Security and linter scans clean"),
  Bullet("Release notes drafted"),
  P("Once every box is checked, the release is cleared for production promotion."),
], "Tester Guide");

async function write(name, doc) {
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(`/tmp/docs/${name}.docx`, buf);
  console.log(`wrote /tmp/docs/${name}.docx (${buf.length} bytes)`);
}

await write("ReadyCheckLab_MVP_Document", mvpDoc);
await write("ReadyCheckLab_User_Manual", userDoc);
await write("ReadyCheckLab_Tester_Guide", testerDoc);
