import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "./ai-gateway";

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

    const { output } = await generateText({
      model,
      output: Output.object({ schema }),
      prompt: `Build a 5-10 step adaptive learning roadmap for someone targeting "${data.targetRole}".\n\nCurrent skills (name:level): ${JSON.stringify(skills ?? [])}\nGaps from latest resume: ${JSON.stringify(latest?.[0]?.gaps ?? [])}\nSuggestions: ${JSON.stringify(latest?.[0]?.suggestions ?? [])}\n\nEach step is concrete and time-boxed. Order matters — earlier steps unblock later ones.`,
    });

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