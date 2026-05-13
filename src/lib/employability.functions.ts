import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const recomputeEmployability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: ra }, { data: skills }, { data: market }] = await Promise.all([
      supabase.from("resume_analyses").select("ats_score").order("created_at", { ascending: false }).limit(1),
      supabase.from("skills").select("name, level"),
      supabase.from("market_demand_seed").select("skill, demand_score"),
    ]);

    const resume_score = ra?.[0]?.ats_score ?? 0;
    const skillsAvg = skills && skills.length
      ? Math.round(skills.reduce((s, x) => s + (x.level ?? 0), 0) / skills.length)
      : 0;

    let fit = 0;
    if (skills && market && skills.length > 0) {
      const m = new Map(market.map((x) => [x.skill.toLowerCase(), x.demand_score]));
      let total = 0, count = 0;
      for (const s of skills) {
        const d = m.get(s.name.toLowerCase());
        if (d != null) {
          total += (s.level / 100) * d;
          count++;
        }
      }
      fit = count > 0 ? Math.round(total / count) : Math.round(skillsAvg * 0.7);
    } else {
      fit = Math.round(skillsAvg * 0.6);
    }

    const composite = Math.round(resume_score * 0.35 + skillsAvg * 0.4 + fit * 0.25);

    const { data: row, error } = await supabase
      .from("employability_scores")
      .insert({
        user_id: userId,
        resume_score,
        skills_score: skillsAvg,
        market_fit: fit,
        composite,
      } as any)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });