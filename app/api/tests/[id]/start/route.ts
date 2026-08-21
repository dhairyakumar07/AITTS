import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await ctx.params; const testId = Number(id);
  const test = db.prepare("SELECT * FROM tests WHERE id=?").get(testId) as any;
  if (!test || !["PUBLISHED","ACTIVE"].includes(test.status)) return NextResponse.json({ error: "Test unavailable." }, { status: 400 });
  const now = new Date();
  if (test.start_time && now < new Date(test.start_time)) return NextResponse.json({ error: "Test has not started yet." }, { status: 400 });
  if (test.end_time && now > new Date(test.end_time)) return NextResponse.json({ error: "Test has closed." }, { status: 400 });
  const submitted = db.prepare("SELECT COUNT(*) AS c FROM attempts WHERE student_id=? AND test_id=? AND submitted_at IS NOT NULL").get(session.id,testId) as any;
  if (submitted.c >= test.max_attempts) return NextResponse.json({ error: "Attempt limit reached." }, { status: 400 });
  const active = db.prepare("SELECT * FROM attempts WHERE student_id=? AND test_id=? AND submitted_at IS NULL ORDER BY id DESC LIMIT 1").get(session.id,testId) as any;
  if (active) return NextResponse.json({ attemptId: active.id, expiresAt: active.expires_at });
  const attemptNumber = Number((db.prepare("SELECT COALESCE(MAX(attempt_number),0) m FROM attempts WHERE student_id=? AND test_id=?").get(session.id,testId) as any).m) + 1;
  const started = new Date(); const expires = new Date(started.getTime() + test.duration_minutes * 60000);
  const r = db.prepare("INSERT INTO attempts(student_id,test_id,attempt_number,started_at,expires_at) VALUES(?,?,?,?,?)").run(session.id,testId,attemptNumber,started.toISOString(),expires.toISOString());
  return NextResponse.json({ attemptId: Number(r.lastInsertRowid), expiresAt: expires.toISOString() });
}
