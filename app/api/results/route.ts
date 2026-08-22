import { NextResponse } from "next/server";
import { all } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const rows = await all(
    `SELECT
      a.id AS "attemptId",
      a.attempt_number AS "attemptNumber",
      a.score,
      a.percentage,
      a.correct_count AS correct,
      a.incorrect_count AS incorrect,
      a.unanswered_count AS unanswered,
      a.time_taken_seconds AS "timeTakenSeconds",
      a.submitted_at AS "submittedAt",
      t.id AS "testId",
      t.title,
      t.subject,
      t.total_marks AS "totalMarks",
      t.show_answer_key AS "showAnswerKey"
     FROM attempts a
     JOIN tests t ON t.id=a.test_id
     WHERE a.student_id=$1
       AND a.submitted_at IS NOT NULL
     ORDER BY a.submitted_at DESC`,
    [session.id]
  );

  return NextResponse.json({ results: rows });
}
