import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { testSchema } from "@/lib/validation";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = db.prepare(`SELECT t.id,t.title,t.description,t.subject,t.duration_minutes as durationMinutes,t.total_marks as totalMarks,t.access_code as accessCode,t.status,t.start_time as startTime,t.end_time as endTime,t.allow_reattempt as allowReattempt,t.max_attempts as maxAttempts,
    (SELECT COUNT(*) FROM questions q WHERE q.test_id=t.id) as questionCount,
    (SELECT COUNT(*) FROM attempts a WHERE a.test_id=t.id AND a.student_id=?) as attemptCount
    FROM tests t WHERE t.status IN ('PUBLISHED','ACTIVE') ORDER BY COALESCE(t.start_time,t.created_at) DESC`).all(session.id);
  return NextResponse.json({ tests: rows });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const body = testSchema.parse(await req.json());
    const exists = db.prepare("SELECT id FROM tests WHERE access_code=?").get(body.accessCode);
    if (exists) return NextResponse.json({ error: "That test code is already in use." }, { status: 409 });
    const total = body.questions.reduce((sum, q) => sum + q.marks, 0);
    const tx = db.transaction(() => {
      const t = db.prepare(`INSERT INTO tests(title,description,subject,duration_minutes,total_marks,access_code,status,start_time,end_time,allow_reattempt,max_attempts,show_answer_key,created_by)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(body.title, body.description || "", body.subject, body.durationMinutes, total, body.accessCode, "PUBLISHED", body.startTime || null, body.endTime || null, body.allowReattempt ? 1 : 0, body.maxAttempts, body.showAnswerKey ? 1 : 0, session.id);
      const qStmt = db.prepare("INSERT INTO questions(test_id,question_text,question_type,marks,negative_marks,sort_order) VALUES(?,?,?,?,?,?)");
      const oStmt = db.prepare("INSERT INTO options(question_id,option_text,option_order) VALUES(?,?,?)");
      const aStmt = db.prepare("INSERT INTO correct_answers(question_id,option_id) VALUES(?,?)");
      body.questions.forEach((q, qi) => {
        if (q.questionType === "SCQ" && q.correctIndexes.length !== 1) throw new Error("SCQ must have exactly one correct answer.");
        if (q.correctIndexes.some(i => i >= q.options.length)) throw new Error("Invalid correct option.");
        const qr = qStmt.run(t.lastInsertRowid, q.questionText, q.questionType, q.marks, q.negativeMarks, qi + 1);
        const ids: number[] = [];
        q.options.forEach((text, oi) => ids.push(Number(oStmt.run(qr.lastInsertRowid, text, oi + 1).lastInsertRowid)));
        q.correctIndexes.forEach(i => aStmt.run(qr.lastInsertRowid, ids[i]));
      });
      return Number(t.lastInsertRowid);
    });
    return NextResponse.json({ ok: true, id: tx });
  } catch (e: any) { return NextResponse.json({ error: e?.issues?.[0]?.message || e.message || "Invalid test." }, { status: 400 }); }
}
