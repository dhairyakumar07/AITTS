import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
export async function GET() {
  const s = await getSession(); if (!s) return NextResponse.json({error:"Unauthorized"},{status:401});
  const rows = db.prepare(`SELECT a.id as attemptId,a.attempt_number as attemptNumber,a.score,a.percentage,a.correct_count as correct,a.incorrect_count as incorrect,a.unanswered_count as unanswered,a.time_taken_seconds as timeTakenSeconds,a.submitted_at as submittedAt,t.id as testId,t.title,t.subject,t.total_marks as totalMarks,t.show_answer_key as showAnswerKey FROM attempts a JOIN tests t ON t.id=a.test_id WHERE a.student_id=? AND a.submitted_at IS NOT NULL ORDER BY a.submitted_at DESC`).all(s.id);
  return NextResponse.json({results:rows});
}
