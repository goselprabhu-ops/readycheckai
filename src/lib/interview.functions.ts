import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "./ai-gateway";
import { chargeAiUsage } from "./ai-guardrails";

export const startInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ roleTarget: z.string().min(1).max(120) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("interview_sessions")
      .insert({ user_id: userId, role_target: data.roleTarget } as any)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const opening = `Hi! I'm your AI interviewer for the ${data.roleTarget} role. Let's start with a warm-up: tell me about a project you're proud of and your specific contribution.`;
    await supabase.from("interview_messages").insert({
      session_id: row.id,
      user_id: userId,
      role: "assistant",
      content: opening,
    } as any);
    return { sessionId: row.id, opening };
  });

export const interviewTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      sessionId: z.string().uuid(),
      userMessage: z.string().min(1).max(4000),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: session } = await supabase
      .from("interview_sessions")
      .select("role_target")
      .eq("id", data.sessionId)
      .single();

    // Enforce per-user daily cap before spending AI tokens.
    await chargeAiUsage(supabase, userId, "interview");

    const { data: history } = await supabase
      .from("interview_messages")
      .select("role, content")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: true });

    await supabase.from("interview_messages").insert({
      session_id: data.sessionId,
      user_id: userId,
      role: "user",
      content: data.userMessage,
    } as any);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway(DEFAULT_MODEL);

    const messages = [
      ...(history ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: data.userMessage },
    ];

    const { text } = await generateText({
      model,
      system: `You are a professional, friendly interviewer for the role "${session?.role_target ?? "Software Engineer"}". Ask one question at a time. Probe for specifics (STAR format). Keep replies under 80 words. After 6 exchanges, give brief feedback and end.`,
      messages,
    });

    await supabase.from("interview_messages").insert({
      session_id: data.sessionId,
      user_id: userId,
      role: "assistant",
      content: text,
    } as any);

    return { reply: text };
  });