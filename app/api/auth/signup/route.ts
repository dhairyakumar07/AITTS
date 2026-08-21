import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { createSession } from "@/lib/auth";
import { signupSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = signupSchema.parse(await req.json());
    const exists = db.prepare("SELECT id FROM users WHERE lower(email)=lower(?)").get(body.email);
    if (exists) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const hash = await bcrypt.hash(body.password, 12);
    const result = db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'STUDENT')").run(body.name, body.email, hash);
    await createSession({ id: Number(result.lastInsertRowid), name: body.name, email: body.email, role: "STUDENT" });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.issues?.[0]?.message || "Invalid signup data." }, { status: 400 });
  }
}
