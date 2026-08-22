import { NextResponse } from "next/server";
import { all, get } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const testId = Number(id);

  const test = await get(
    `SELECT
      id,title,description,subject,
      duration_minutes AS "durationMinutes",
      total_marks AS "totalMarks",
      access_code AS "accessCode",
      status,
      start_time AS "startTime",
      end_time AS "endTime",
      allow_reattempt AS "allowReattempt",
      max_attempts AS "maxAttempts",
      show_answer_key AS "showAnswerKey"
     FROM tests WHERE id=$1`,
    [testId]
  );

  if (
    !test ||
    (session.role !== "ADMIN" &&
      !["PUBLISHED", "ACTIVE"].includes((test as any).status))
  ) {
    return NextResponse.json(
      { error: "Test not found." },
      { status: 404 }
    );
  }

  const questions = await all(
    `SELECT
      id,
      question_text AS "questionText",
      question_type AS "questionType",
      marks,
      negative_marks AS "negativeMarks",
      sort_order AS "sortOrder"
     FROM questions
     WHERE test_id=$1
     ORDER BY sort_order`,
    [testId]
  );

  const options = await all(
    `SELECT
      id,
      question_id AS "questionId",
      option_text AS "optionText",
      option_order AS "optionOrder"
     FROM options
     WHERE question_id IN (
       SELECT id FROM questions WHERE test_id=$1
     )
     ORDER BY question_id,option_order`,
    [testId]
  );

  return NextResponse.json({
    test,
    questions: questions.map((q: any) => ({
      ...q,
      options: options.filter(
        (o: any) => o.questionId === q.id
      ),
    })),
  });
}
