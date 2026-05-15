import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash, randomInt } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OTP_LENGTH = 4;
const OTP_TTL_MIN = 5;
const MAX_ATTEMPTS = 3;
const RESEND_COOLDOWN_SEC = 30;

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "Phone must be in E.164 format e.g. +14155552671");

function hashCode(code: string, userId: string) {
  return createHash("sha256").update(`${userId}:${code}`).digest("hex");
}

async function sendMsg91Sms(to: string, code: string) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  const senderId = process.env.MSG91_SENDER_ID;
  if (!authKey) throw new Error("MSG91_AUTH_KEY is not configured");
  if (!templateId) throw new Error("MSG91_TEMPLATE_ID is not configured");
  if (!senderId) throw new Error("MSG91_SENDER_ID is not configured");

  // MSG91 expects mobile in international format WITHOUT the leading `+`.
  const mobile = to.replace(/^\+/, "");

  const url = new URL("https://control.msg91.com/api/v5/flow");
  const reqBody = {
    template_id: templateId,
    sender: senderId,
    short_url: "0",
    recipients: [{ mobiles: mobile, otp: code }],
  };
  console.log("[MSG91] sending", { url: url.toString(), body: { ...reqBody, recipients: [{ mobiles: mobile, otp: "****" }] } });
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      authkey: authKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(reqBody),
  });
  const data = await res.json().catch(() => ({}));
  console.log("[MSG91] response", { status: res.status, data });
  if (!res.ok || (data as any)?.type === "error") {
    throw new Error(
      `MSG91 error [${res.status}]: ${(data as any)?.message || JSON.stringify(data)}`,
    );
  }
  return data;
}

export const sendPhoneOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ phone: phoneSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Cooldown: reject if last OTP was sent < RESEND_COOLDOWN_SEC ago.
    const { data: recent } = await supabase
      .from("phone_otps")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent?.created_at) {
      const ageSec = (Date.now() - new Date(recent.created_at).getTime()) / 1000;
      if (ageSec < RESEND_COOLDOWN_SEC) {
        throw new Error(
          `Please wait ${Math.ceil(RESEND_COOLDOWN_SEC - ageSec)}s before requesting a new code`,
        );
      }
    }

    const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
    const expires_at = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000).toISOString();

    const { error: insErr } = await supabase.from("phone_otps").insert({
      user_id: userId,
      phone: data.phone,
      code_hash: hashCode(code, userId),
      expires_at,
    });
    if (insErr) throw new Error(insErr.message);

    await sendMsg91Sms(data.phone, code);

    return { ok: true, expires_at };
  });

export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ phone: phoneSchema, code: z.string().regex(/^\d{4}$/) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: row, error } = await supabase
      .from("phone_otps")
      .select("id, code_hash, expires_at, attempts, consumed_at, phone")
      .eq("user_id", userId)
      .eq("phone", data.phone)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("No active code. Please request a new one.");
    if (new Date(row.expires_at).getTime() < Date.now())
      throw new Error("Code expired. Please request a new one.");
    if (row.attempts >= MAX_ATTEMPTS)
      throw new Error("Too many attempts. Please request a new code.");

    const matches = row.code_hash === hashCode(data.code, userId);
    if (!matches) {
      await supabase
        .from("phone_otps")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      const left = MAX_ATTEMPTS - row.attempts - 1;
      throw new Error(
        left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.` : "Incorrect code.",
      );
    }

    await supabase
      .from("phone_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id);

    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        phone: data.phone,
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (pErr) throw new Error(pErr.message);

    return { ok: true };
  });