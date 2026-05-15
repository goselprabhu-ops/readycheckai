import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "./ai-gateway";
import { chargeAiUsage } from "./ai-guardrails";
import { enforceCooldown } from "./security";

export const generateRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      targetRole: z.string().min(1).max(120),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: skills } = await supabase.from("skills").select("name, level");
    const { data: latest } = await supabase
      .from("resume_analyses")
      .select("gaps, suggestions")
      .order("created_at", { ascending: false })
      .limit(1);

    // Enforce per-user daily AI cap (roadmap generation counts as assessment_gen).
    await enforceCooldown(supabase, "roadmap_generate", 60);
    await chargeAiUsage(supabase, userId, "assessment_gen");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway(DEFAULT_MODEL);

    const schema = z.object({
      items: z.array(z.object({
        title: z.string(),
        description: z.string(),
        est_minutes: z.number().min(15).max(600),
      })).min(5).max(10),
    });

    let output: z.infer<typeof schema>;
    try {
      const res = await generateText({
        model,
        output: Output.object({ schema }),
        prompt: `Build a 5-10 step adaptive learning roadmap for someone targeting "${data.targetRole}".\n\nCurrent skills (name:level): ${JSON.stringify(skills ?? [])}\nGaps from latest resume: ${JSON.stringify(latest?.[0]?.gaps ?? [])}\nSuggestions: ${JSON.stringify(latest?.[0]?.suggestions ?? [])}\n\nReturn ONLY a JSON object: { "items": [ { "title": string, "description": string, "est_minutes": number between 15 and 600 } ] } with 5 to 10 items. Each step concrete and time-boxed. Earlier steps unblock later ones.`,
      });
      output = res.output;
    } catch (err: any) {
      // Fallback: parse raw text if structured output failed validation
      const raw = err?.text ?? err?.response?.text ?? "";
      const match = typeof raw === "string" ? raw.match(/\{[\s\S]*\}/) : null;
      if (!match) throw new Error("AI returned an unparseable roadmap. Please try again.");
      try {
        output = schema.parse(JSON.parse(match[0]));
      } catch {
        throw new Error("AI returned an invalid roadmap. Please try again.");
      }
    }

    // wipe + insert fresh roadmap
    await supabase.from("roadmap_items").delete().eq("user_id", userId);
    const rows = output.items.map((it, i) => ({
      user_id: userId,
      title: it.title,
      description: it.description,
      est_minutes: it.est_minutes,
      order_index: i,
      status: "pending",
    }));
    const { data: inserted, error } = await supabase
      .from("roadmap_items")
      .insert(rows as any)
      .select();
    if (error) throw new Error(error.message);
    return { items: inserted };
  });

export const updateRoadmapItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "in_progress", "done"]),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("roadmap_items")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });