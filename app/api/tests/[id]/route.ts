import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const test = db.prepare(`SELECT id,title,description,subject,duration_minutes as durationMinutes,total_marks as totalMarks,access_code as accessCode,status,start_time as startTime,end_time as endTime,allow_reattempt as allowReattempt,max_attempts as maxAttempts,show_answer_key as showAnswerKey FROM tests WHERE id=?`).get(Number(id)) as any;
  if (!test || (session.role !== "ADMIN" && !["PUBLISHED","ACTIVE"].includes(test.status))) return NextResponse.json({ error: "Test not found." }, { status: 404 });
  const questions = db.prepare(`SELECT id,question_text as questionText,question_type as questionType,marks,negative_marks as negativeMarks,sort_order as sortOrder FROM questions WHERE test_id=? ORDER BY sort_order`).all(Number(id)) as any[];
  const options = db.prepare(`SELECT id,question_id as questionId,option_text as optionText,option_order as optionOrder FROM options WHERE question_id IN (SELECT id FROM questions WHERE test_id=?) ORDER BY question_id,option_order`).all(Number(id)) as any[];
  return NextResponse.json({ test, questions: questions.map(q => ({ ...q, options: options.filter(o => o.questionId === q.id) })) });
}
