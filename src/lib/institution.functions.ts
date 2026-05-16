import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "inst";

export const listMyInstitutions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: memberships, error } = await supabase
      .from("institution_members")
      .select("role, institution:institutions(id,name,slug,type,logo_url,domain)")
      .eq("user_id", userId);
    if (error) throw error;
    return (memberships ?? []).map((m: any) => ({ role: m.role, ...m.institution }));
  });

export const createInstitution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        name: z.string().min(2).max(120),
        type: z.enum(["college", "bootcamp", "placement_center", "other"]).default("college"),
        contact_email: z.string().email().optional().or(z.literal("")).optional(),
        domain: z.string().max(120).optional().or(z.literal("")).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const base = slugify(data.name);
    const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: inst, error } = await supabase
      .from("institutions")
      .insert({
        name: data.name,
        slug,
        type: data.type,
        contact_email: data.contact_email || null,
        domain: data.domain || null,
        created_by: userId,
      })
      .select()
      .single();
    if (error) throw error;
    const { error: mErr } = await supabase
      .from("institution_members")
      .insert({ institution_id: inst.id, user_id: userId, role: "owner" });
    if (mErr) throw mErr;
    return inst;
  });

export const getInstitutionDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        institution_id: z.string().uuid(),
        department: z.string().max(80).optional(),
        cohort_id: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(200).optional(),
        offset: z.number().int().min(0).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: result, error } = await supabase.rpc("institution_dashboard", {
      _inst: data.institution_id,
      _department: data.department ?? undefined,
      _cohort_id: data.cohort_id ?? undefined,
      _limit: data.limit ?? 25,
      _offset: data.offset ?? 0,
    });
    if (error) throw error;
    const { data: cohorts } = await supabase
      .from("cohorts")
      .select("id,name,department,start_date,end_date")
      .eq("institution_id", data.institution_id)
      .order("created_at", { ascending: false });
    const { data: members } = await supabase
      .from("institution_members")
      .select("user_id, role, created_at")
      .eq("institution_id", data.institution_id);
    return { dashboard: result, cohorts: cohorts ?? [], members: members ?? [] };
  });

export const createCohort = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        institution_id: z.string().uuid(),
        name: z.string().min(2).max(120),
        department: z.string().max(80).optional(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("cohorts")
      .insert({
        institution_id: data.institution_id,
        name: data.name,
        department: data.department || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const addStudentByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        institution_id: z.string().uuid(),
        email: z.string().email(),
        cohort_id: z.string().uuid().optional(),
        department: z.string().max(80).optional(),
        enrollment_no: z.string().max(40).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // Try to resolve user by profile email (auth.users not accessible via anon client)
    // We accept email and store it; user_id may be backfilled later when student signs up.
    // For V1 we require the student to already exist in profiles to be linked.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .ilike("full_name", `%${data.email.split("@")[0]}%`)
      .limit(1)
      .maybeSingle();
    if (!profile?.id) {
      throw new Error(
        "Student must have a ReadyCheck account first. Ask them to sign up, then add them again.",
      );
    }
    const { data: row, error } = await supabase
      .from("institution_students")
      .insert({
        institution_id: data.institution_id,
        user_id: profile.id,
        student_email: data.email,
        cohort_id: data.cohort_id ?? null,
        department: data.department ?? null,
        enrollment_no: data.enrollment_no ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const exportInstitutionReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ institution_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: result, error } = await supabase.rpc("institution_dashboard", {
      _inst: data.institution_id,
    });
    if (error) throw error;
    return { exported_at: new Date().toISOString(), data: result };
  });