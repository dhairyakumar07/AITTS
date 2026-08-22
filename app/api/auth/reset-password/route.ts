import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { get, run } from "@/lib/db";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (typeof token !== "string" || token.length < 20 || typeof password !== "string" || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    const tokenHash = hashToken(token);
    const row = await get<{ id: number }>(
      `SELECT u.id FROM password_reset_tokens prt
       JOIN users u ON u.id=prt.user_id
       WHERE prt.token_hash=$1 AND prt.expires_at > CURRENT_TIMESTAMP`,
      [tokenHash]
    );

    if (!row) return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });

    const passwordHash = await bcrypt.hash(password, 12);
    await run("UPDATE users SET password_hash=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2", [passwordHash, row.id]);
    await run("DELETE FROM password_reset_tokens WHERE user_id=$1", [row.id]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return NextResponse.json({ error: "Unable to reset password." }, { status: 500 });
  }
}
