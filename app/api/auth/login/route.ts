import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession, getUserByEmail } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: Request) {
  try {
    const body = loginSchema.parse(await req.json());
    const key = body.email.toLowerCase();
    const now = Date.now();
    const state = attempts.get(key);

    if (state && state.resetAt > now && state.count >= 8) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 }
      );
    }

    const user = await getUserByEmail(body.email);

    const ok = user
      ? await bcrypt.compare(body.password, user.password_hash)
      : false;

    if (!ok) {
      const next =
        state && state.resetAt > now
          ? { count: state.count + 1, resetAt: state.resetAt }
          : { count: 1, resetAt: now + 15 * 60 * 1000 };

      attempts.set(key, next);

      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    attempts.delete(key);

    await createSession({
      id: Number(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.issues?.[0]?.message || "Invalid login data." },
      { status: 400 }
    );
  }
}
