import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { withRetry } from "@/lib/ai-gateway";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "./ai-gateway";
import { chargeAiUsage } from "./ai-guardrails";

const educationItem = z.object({
  institution: z.string().default(""),
  degree: z.string().default(""),
  field: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default(""),
  grade: z.string().default(""),
});

const experienceItem = z.object({
  company: z.string().default(""),
  role: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default(""),
  description: z.string().default(""),
});

const projectItem = z.object({
  name: z.string().default(""),
  description: z.string().default(""),
  link: z.string().default(""),
  tech: z.array(z.string()).default([]),
});

const certItem = z.object({
  name: z.string().default(""),
  issuer: z.string().default(""),
  year: z.string().default(""),
});

export const profileSchema = z.object({
  full_name: z.string().max(120).optional().nullable(),
  headline: z.string().max(160).optional().nullable(),
  phone: z.string().max(32).optional().nullable(),
  photo_url: z.string().url().max(500).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  dob: z.string().optional().nullable(),
  gender: z.string().max(32).optional().nullable(),
  college: z.string().max(160).optional().nullable(),
  year: z.string().max(32).optional().nullable(),
  target_role: z.string().max(120).optional().nullable(),
  linkedin_url: z.string().max(300).optional().nullable(),
  github_url: z.string().max(300).optional().nullable(),
  portfolio_url: z.string().max(300).optional().nullable(),
  summary: z.string().max(2000).optional().nullable(),
  education: z.array(educationItem).max(10).optional(),
  experience: z.array(experienceItem).max(15).optional(),
  projects: z.array(projectItem).max(15).optional(),
  certifications: z.array(certItem).max(15).optional(),
  languages: z.array(z.string().max(40)).max(15).optional(),
  achievements: z.array(z.string().max(280)).max(15).optional(),
  interests: z.array(z.string().max(40)).max(15).optional(),
  onboarded: z.boolean().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const getMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: data };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Strip undefined so we don't overwrite existing values with null.
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) payload[k] = v;
    }
    payload.updated_at = new Date().toISOString();

    const { data: row, error } = await supabase
      .from("profiles")
      .update(payload as any)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { profile: row };
  });

export const parseResumeForProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ text: z.string().min(50).max(50000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");
    const { supabase, userId } = context;

    await chargeAiUsage(supabase, userId, "resume_ai");

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway(DEFAULT_MODEL);

    const schema = z.object({
      full_name: z.string().default(""),
      headline: z.string().default(""),
      phone: z.string().default(""),
      email: z.string().default(""),
      location: z.string().default(""),
      summary: z.string().default(""),
      linkedin_url: z.string().default(""),
      github_url: z.string().default(""),
      portfolio_url: z.string().default(""),
      college: z.string().default(""),
      year: z.string().default(""),
      target_role: z.string().default(""),
      education: z.array(educationItem).default([]),
      experience: z.array(experienceItem).default([]),
      projects: z.array(projectItem).default([]),
      certifications: z.array(certItem).default([]),
      skills: z.array(z.string()).default([]),
      languages: z.array(z.string()).default([]),
      achievements: z.array(z.string()).default([]),
      interests: z.array(z.string()).default([]),
    });

    const { output } = await withRetry(() => generateText({
      model,
      output: Output.object({ schema }),
      prompt: `Extract a structured profile from the following resume text. For any field that is not present, return an empty string or empty array. Dates should stay as written (e.g. "Aug 2023", "2024"). Do not invent information.\n\nRESUME:\n${data.text}`,
    }));

    return { extracted: output };
  });