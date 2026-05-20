const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType, LevelFormat } = require("docx");
const fs = require("fs");

// Colors
const PRIMARY = "1E3A5F";
const ACCENT = "4ADE80";
const DARK = "0F1B3D";
const LIGHT_BG = "F5F7FA";
const GRAY = "666666";

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: PRIMARY },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 1, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // Title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: "ReadyCheck Lab", bold: true, size: 52, color: DARK, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: "PUBLIC LAUNCH ANNOUNCEMENT", bold: true, size: 24, color: PRIMARY, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: "May 2026  —  Public Beta Now Live", size: 22, color: GRAY, font: "Arial" })]
      }),

      // Intro
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("We are live.")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "ReadyCheck Lab is now open to the public.", bold: true, size: 24, color: DARK })]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("After months of development and closed testing, we are opening the doors to our public beta. ReadyCheck Lab is an AI-native career readiness platform built for students, colleges, and recruiters — designed to replace guesswork with verified readiness signals.")]
      }),
      new Paragraph({
        spacing: { after: 300 },
        children: [new TextRun("During our private beta, early users from universities and placement cells helped us refine every feature. Today, that work is yours to use — free while we scale.")]
      }),

      // What We Built
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("What we built")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("ReadyCheck Lab turns career preparation into measurable, improvable readiness. Here is what the platform delivers today:")]
      }),

      // Feature Table
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 6560],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                width: { size: 2800, type: WidthType.DXA },
                shading: { fill: PRIMARY, type: ShadingType.CLEAR },
                margins: { top: 100, bottom: 100, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "Feature", bold: true, color: "FFFFFF" })] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 6560, type: WidthType.DXA },
                shading: { fill: PRIMARY, type: ShadingType.CLEAR },
                margins: { top: 100, bottom: 100, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "What it does", bold: true, color: "FFFFFF" })] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Resume Intelligence", bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun("AI parses, scores, and rewrites resumes against target roles — line by line. ATS gap analysis, keyword benchmarking, and quantified impact suggestions included.")] })] }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, shading: { fill: LIGHT_BG, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Mock Interviews", bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, shading: { fill: LIGHT_BG, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun("Live AI interviewer that adapts to your target role. Rubric-based feedback on communication, depth, structure, and role fit — with replayable transcripts.")] })] }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Role Readiness", bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun("Skill-by-skill readiness score against the actual job market. Know exactly where you stand and what to fix before you apply.")] })] }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, shading: { fill: LIGHT_BG, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "Cohort Analytics", bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, shading: { fill: LIGHT_BG, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun("Institutions get placement-grade dashboards. Track every student's readiness, identify top skill gaps, and measure improvement over time.")] })] }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Recruiter Signals", bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun("Verified readiness signals — not just resumes. Recruiters shortlist faster with assessment scores, interview transcripts, and skill evidence in one view.")] })] }),
            ]
          }),
        ]
      }),

      new Paragraph({ spacing: { after: 100 }, children: [] }),

      // Who it is for
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Who it is for")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 1 },
        children: [new TextRun({ text: "Students & Job Seekers: ", bold: true }), new TextRun("Prepare with precision. Get resume scores, practice interviews, and understand your gaps before employers do.")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 1 },
        children: [new TextRun({ text: "Colleges & Training Institutions: ", bold: true }), new TextRun("Track cohort readiness, identify at-risk students, and guide placement preparation with data instead of intuition.")]
      }),
      new Paragraph({
        spacing: { after: 300 },
        numbering: { reference: "bullets", level: 1 },
        children: [new TextRun({ text: "Recruiters & Employers: ", bold: true }), new TextRun("Cut screening time by shortlisting from verified readiness signals — scores, transcripts, and skill evidence — not keyword-matching.")]
      }),

      // Pricing
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Pricing during public beta")]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "Free. ", bold: true }), new TextRun("Every core feature is available at no cost during the public beta. We will announce paid tiers as we move toward general availability, but early users will receive priority pricing and extended access.")]
      }),

      // How to access
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("How to access")]
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun("Visit "), new TextRun({ text: "https://readychecklab.com", bold: true, color: PRIMARY }), new TextRun(" or "), new TextRun({ text: "https://readycheckai.lovable.app", bold: true, color: PRIMARY }), new TextRun(" and sign up with Google or email. No credit card required. No waitlist.")]
      }),
      new Paragraph({
        spacing: { after: 300 },
        children: [new TextRun("Institutions and recruiters interested in enterprise or bulk access should contact us via the form on the site.")]
      }),

      // What is next
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("What is next")]
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun("The public beta is a milestone, not a finish line. Our roadmap includes:")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 1 },
        children: [new TextRun("Mobile app for iOS and Android")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 1 },
        children: [new TextRun("Integration with learning management systems")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 1 },
        children: [new TextRun("Advanced recruiter APIs and ATS integrations")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 1 },
        children: [new TextRun("Multi-language support and regional role benchmarking")]
      }),
      new Paragraph({
        spacing: { after: 300 },
        numbering: { reference: "bullets", level: 1 },
        children: [new TextRun("Enterprise SSO and institution-wide analytics")]
      }),

      // Closing
      new Paragraph({
        spacing: { before: 200, after: 200 },
        shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
        children: [new TextRun({ text: "We built ReadyCheck Lab because career readiness should not be a black box. Whether you are a student wondering if you are ready, a college tracking placement outcomes, or a recruiter tired of resume keyword games — we are here to make readiness visible, measurable, and improvable.", italics: true })]
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 80 },
        children: [new TextRun({ text: "Sign up today at readychecklab.com", bold: true, size: 26, color: PRIMARY })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "— The ReadyCheck Lab Team", size: 20, color: GRAY, italics: true })]
      }),

      // Contact / Footer
      new Paragraph({
        spacing: { before: 200 },
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY, space: 8 } },
        children: [new TextRun({ text: "Contact & Press", bold: true, size: 20, color: DARK })]
      }),
      new Paragraph({
        children: [new TextRun({ text: "Website: ", bold: true }), new TextRun("https://readychecklab.com")]
      }),
      new Paragraph({
        children: [new TextRun({ text: "Beta Access: ", bold: true }), new TextRun("https://readycheckai.lovable.app")]
      }),
      new Paragraph({
        children: [new TextRun({ text: "Email: ", bold: true }), new TextRun("contact form available on site")]
      }),
      new Paragraph({
        children: [new TextRun({ text: "For press, partnership, or institutional inquiries, reach out via the contact page on our website.", size: 20, color: GRAY })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/mnt/documents/ReadyCheck_Lab_Launch_Announcement.docx", buffer);
  console.log("DOCX written to /mnt/documents/ReadyCheck_Lab_Launch_Announcement.docx");
});
