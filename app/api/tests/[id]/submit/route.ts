import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

function sameSet(a: number[], b: number[]) { return a.length === b.length && a.every(v => b.includes(v)); }

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await ctx.params; const testId = Number(id); const body = await req.json();
  const attemptId = Number(body.attemptId); const submittedAnswers = body.answers as Record<string,string[]>;
  if (!attemptId || !submittedAnswers || typeof submittedAnswers !== "object") return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  const attempt = db.prepare("SELECT * FROM attempts WHERE id=? AND test_id=? AND student_id=? AND submitted_at IS NULL").get(attemptId,testId,session.id) as any;
  if (!attempt) return NextResponse.json({ error: "Attempt not found or already submitted." }, { status: 400 });
  const test = db.prepare("SELECT * FROM tests WHERE id=?").get(testId) as any;
  const questions = db.prepare("SELECT * FROM questions WHERE test_id=? ORDER BY sort_order").all(testId) as any[];
  const optionRows = db.prepare("SELECT * FROM options WHERE question_id IN (SELECT id FROM questions WHERE test_id=?)").all(testId) as any[];
  const correctRows = db.prepare("SELECT question_id, option_id FROM correct_answers WHERE question_id IN (SELECT id FROM questions WHERE test_id=?)").all(testId) as any[];
  let score = 0, correct = 0, incorrect = 0, unanswered = 0;
  const answersToStore: Array<[number,number,number]> = [];
  for (const q of questions) {
    const selected = Array.isArray(submittedAnswers[String(q.id)]) ? submittedAnswers[String(q.id)].map(Number).filter(Number.isInteger) : [];
    const validOptions = optionRows.filter(o => o.question_id === q.id).map(o => o.id);
    const safe = [...new Set(selected.filter(x => validOptions.includes(x)))].sort((a,b)=>a-b);
    const correctIds = correctRows.filter(a => a.question_id === q.id).map(a=>a.option_id).sort((a,b)=>a-b);
    if (safe.length === 0) unanswered++;
    else if (sameSet(safe, correctIds)) { correct++; score += q.marks; }
    else { incorrect++; score -= q.negative_marks; }
    safe.forEach(optionId => answersToStore.push([attemptId,q.id,optionId]));
  }
  const maxScore = Number(test.total_marks) || 0;
  const percentage = maxScore ? Math.max(0, (score / maxScore) * 100) : 0;
  const now = new Date();
  const expires = new Date(attempt.expires_at);
  const finalTime = Math.max(0, Math.min(Math.floor((now.getTime()-new Date(attempt.started_at).getTime())/1000), Math.floor((expires.getTime()-new Date(attempt.started_at).getTime())/1000)));
  const tx = db.transaction(() => {
    const a = db.prepare(`UPDATE attempts SET submitted_at=?,score=?,percentage=?,correct_count=?,incorrect_count=?,unanswered_count=?,time_taken_seconds=? WHERE id=?`).run(now.toISOString(),score,percentage,correct,incorrect,unanswered,finalTime,attemptId);
    const ins = db.prepare("INSERT INTO student_answers(attempt_id,question_id,option_id) VALUES(?,?,?)");
    answersToStore.forEach(x => ins.run(...x)); return a;
  });
  tx();
  return NextResponse.json({ ok:true, result:{ attemptId, score, maxScore, percentage, correct, incorrect, unanswered, timeTakenSeconds: finalTime, showAnswerKey: !!test.show_answer_key } });
}
