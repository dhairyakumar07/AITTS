import { NextResponse } from "next/server";
import { transaction } from "@/lib/db";
import { getSession } from "@/lib/auth";

function sameSet(a: number[], b: number[]) {
  return a.length === b.length && a.every(v => b.includes(v));
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session || session.role !== "STUDENT") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const testId = Number(id);
  const body = await req.json();

  const attemptId = Number(body.attemptId);
  const submittedAnswers =
    body.answers as Record<string, string[]>;

  if (
    !attemptId ||
    !submittedAnswers ||
    typeof submittedAnswers !== "object"
  ) {
    return NextResponse.json(
      { error: "Invalid submission." },
      { status: 400 }
    );
  }

  try {
    const result = await transaction(async client => {
      const attemptResult = await client.query(
        `SELECT *
         FROM attempts
         WHERE id=$1
           AND test_id=$2
           AND student_id=$3
           AND submitted_at IS NULL`,
        [attemptId, testId, session.id]
      );

      const attempt = attemptResult.rows[0] as any;

      if (!attempt) {
        throw new Error("Attempt not found or already submitted.");
      }

      const testResult = await client.query(
        "SELECT * FROM tests WHERE id=$1",
        [testId]
      );

      const test = testResult.rows[0] as any;

      if (!test) {
        throw new Error("Test not found.");
      }

      const questionsResult = await client.query(
        `SELECT *
         FROM questions
         WHERE test_id=$1
         ORDER BY sort_order`,
        [testId]
      );

      const questions = questionsResult.rows as any[];

      const optionResult = await client.query(
        `SELECT *
         FROM options
         WHERE question_id IN (
           SELECT id FROM questions WHERE test_id=$1
         )`,
        [testId]
      );

      const optionRows = optionResult.rows as any[];

      const correctResult = await client.query(
        `SELECT question_id,option_id
         FROM correct_answers
         WHERE question_id IN (
           SELECT id FROM questions WHERE test_id=$1
         )`,
        [testId]
      );

      const correctRows = correctResult.rows as any[];

      let score = 0;
      let correct = 0;
      let incorrect = 0;
      let unanswered = 0;

      const answersToStore: [number, number, number][] = [];

      for (const q of questions) {
        const raw = submittedAnswers[String(q.id)];
        const selected = Array.isArray(raw)
          ? raw.map(Number).filter(Number.isInteger)
          : [];

        const validOptions = optionRows
          .filter(o => Number(o.question_id) === Number(q.id))
          .map(o => Number(o.id));

        const safe = [...new Set(
          selected.filter(x => validOptions.includes(x))
        )].sort((a, b) => a - b);

        const correctIds = correctRows
          .filter(a => Number(a.question_id) === Number(q.id))
          .map(a => Number(a.option_id))
          .sort((a, b) => a - b);

        if (safe.length === 0) {
          unanswered++;
        } else if (sameSet(safe, correctIds)) {
          correct++;
          score += Number(q.marks);
        } else {
          incorrect++;
          score -= Number(q.negative_marks);
        }

        for (const optionId of safe) {
          answersToStore.push([
            attemptId,
            Number(q.id),
            optionId,
          ]);
        }
      }

      const maxScore = Number(test.total_marks) || 0;
      const percentage =
        maxScore > 0
          ? Math.max(0, (score / maxScore) * 100)
          : 0;

      const now = new Date();
      const expires = new Date(attempt.expires_at);
      const started = new Date(attempt.started_at);

      const finalTime = Math.max(
        0,
        Math.min(
          Math.floor((now.getTime() - started.getTime()) / 1000),
          Math.floor((expires.getTime() - started.getTime()) / 1000)
        )
      );

      await client.query(
        `UPDATE attempts
         SET submitted_at=$1,
             score=$2,
             percentage=$3,
             correct_count=$4,
             incorrect_count=$5,
             unanswered_count=$6,
             time_taken_seconds=$7
         WHERE id=$8`,
        [
          now.toISOString(),
          score,
          percentage,
          correct,
          incorrect,
          unanswered,
          finalTime,
          attemptId,
        ]
      );

      for (const [a, q, o] of answersToStore) {
        await client.query(
          `INSERT INTO student_answers(
            attempt_id,question_id,option_id
          )
          VALUES($1,$2,$3)`,
          [a, q, o]
        );
      }

      return {
        attemptId,
        score,
        maxScore,
        percentage,
        correct,
        incorrect,
        unanswered,
        timeTakenSeconds: finalTime,
        showAnswerKey: !!test.show_answer_key,
      };
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Submission failed." },
      { status: 400 }
    );
  }
}
