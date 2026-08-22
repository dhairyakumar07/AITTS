import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { get, run } from "@/lib/db";

async function ensureResetTable() {
  await run(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expiry ON password_reset_tokens(expires_at);
  `);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalized = String(email || "").trim().toLowerCase();

    // Always keep the response generic so emails cannot be enumerated.
    const generic = { message: "If an account exists for that email, a reset link has been sent." };
    if (!normalized || !normalized.includes("@") || normalized.length > 160) {
      return NextResponse.json(generic);
    }

    await ensureResetTable();
    const user = await get<{ id: number; email: string; name: string }>(
      "SELECT id,email,name FROM users WHERE lower(email)=lower($1)",
      [normalized]
    );
    if (!user) return NextResponse.json(generic);

    await run("DELETE FROM password_reset_tokens WHERE user_id=$1 OR expires_at < CURRENT_TIMESTAMP", [user.id]);

    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    await run(
      "INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES($1,$2,CURRENT_TIMESTAMP + INTERVAL '1 hour')",
      [user.id, tokenHash]
    );

    const origin = new URL(req.url).origin;
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
      console.error("Password reset email service is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL).");
      return NextResponse.json({ error: "Password reset email service is temporarily unavailable." }, { status: 503 });
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [user.email],
        subject: "Reset your AITTS password",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#111522">
            <div style="font-weight:800;font-size:22px;margin-bottom:22px">AITTS</div>
            <h1 style="font-size:28px;margin-bottom:10px">Reset your password</h1>
            <p style="color:#697184;line-height:1.6">Hi ${String(user.name).replace(/[&<>\"]/g, "")}, we received a request to reset your AITTS password.</p>
            <p><a href="${resetUrl}" style="display:inline-block;background:#5b45e8;color:white;padding:13px 18px;border-radius:10px;text-decoration:none;font-weight:700">Reset password</a></p>
            <p style="color:#697184;font-size:13px;line-height:1.6">This link expires in 1 hour and can only be used once. If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      console.error("Resend error:", await emailResponse.text());
      await run("DELETE FROM password_reset_tokens WHERE token_hash=$1", [tokenHash]);
      return NextResponse.json({ error: "Password reset email service is temporarily unavailable." }, { status: 503 });
    }

    return NextResponse.json(generic);
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return NextResponse.json({ error: "Unable to process the request." }, { status: 500 });
  }
}
