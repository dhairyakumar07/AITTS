import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { all, get, transaction } from "@/lib/db";
import { testSchema } from "@/lib/validation";

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
      t.id,
      t.title,
      t.description,
      t.subject,
      t.duration_minutes AS "durationMinutes",
      t.total_marks AS "totalMarks",
      t.access_code AS "accessCode",
      t.status,
      t.start_time AS "startTime",
      t.end_time AS "endTime",
      t.allow_reattempt AS "allowReattempt",
      t.max_attempts AS "maxAttempts",
      (SELECT COUNT(*) FROM questions q WHERE q.test_id=t.id) AS "questionCount",
      (SELECT COUNT(*) FROM attempts a
       WHERE a.test_id=t.id AND a.student_id=$1) AS "attemptCount"
     FROM tests t
     WHERE t.status IN ('PUBLISHED','ACTIVE')
     ORDER BY COALESCE(t.start_time,t.created_at) DESC`,
    [session.id]
  );

  return NextResponse.json({ tests: rows });
}

export async function POST(req: Request) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  try {
    const body = testSchema.parse(await req.json());

    const exists = await get(
      "SELECT id FROM tests WHERE access_code=$1",
      [body.accessCode]
    );

    if (exists) {
      return NextResponse.json(
        { error: "That test code is already in use." },
        { status: 409 }
      );
    }

    const total = body.questions.reduce(
      (sum, q) => sum + q.marks,
      0
    );

    const id = await transaction(async client => {
      const t = await client.query(
        `INSERT INTO tests(
          title,
          description,
          subject,
          duration_minutes,
          total_marks,
          access_code,
          status,
          start_time,
          end_time,
          allow_reattempt,
          max_attempts,
          show_answer_key,
          created_by
        )
        VALUES(
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          'PUBLISHED',
          $7,
          $8,
          $9,
          $10,
          $11,
          $12
        )
        RETURNING id`,
        [
          body.title,
          body.description || "",
          body.subject,
          body.durationMinutes,
          total,
          body.accessCode,
          body.startTime || null,
          body.endTime || null,

          // PostgreSQL column is INTEGER, so use 1/0
          body.allowReattempt ? 1 : 0,

          body.maxAttempts,

          // PostgreSQL column is INTEGER, so use 1/0
          body.showAnswerKey ? 1 : 0,

          session.id,
        ]
      );

      const testId = Number(t.rows[0].id);

      for (let qi = 0; qi < body.questions.length; qi++) {
        const q = body.questions[qi];

        if (
          q.questionType === "SCQ" &&
          q.correctIndexes.length !== 1
        ) {
          throw new Error(
            "SCQ must have exactly one correct answer."
          );
        }

        if (
          q.correctIndexes.some(
            i => i < 0 || i >= q.options.length
          )
        ) {
          throw new Error("Invalid correct option.");
        }

        const qr = await client.query(
          `INSERT INTO questions(
            test_id,
            question_text,
            question_type,
            marks,
            negative_marks,
            sort_order
          )
          VALUES($1,$2,$3,$4,$5,$6)
          RETURNING id`,
          [
            testId,
            q.questionText,
            q.questionType,
            q.marks,
            q.negativeMarks,
            qi + 1,
          ]
        );

        const questionId = Number(qr.rows[0].id);
        const ids: number[] = [];

        for (let oi = 0; oi < q.options.length; oi++) {
          const or = await client.query(
            `INSERT INTO options(
              question_id,
              option_text,
              option_order
            )
            VALUES($1,$2,$3)
            RETURNING id`,
            [
              questionId,
              q.options[oi],
              oi + 1,
            ]
          );

          ids.push(Number(or.rows[0].id));
        }

        for (const index of q.correctIndexes) {
          await client.query(
            `INSERT INTO correct_answers(
              question_id,
              option_id
            )
            VALUES($1,$2)`,
            [
              questionId,
              ids[index],
            ]
          );
        }
      }

      return testId;
    });

    return NextResponse.json({
      ok: true,
      id,
    });

  } catch (e: any) {
    console.error("CREATE TEST ERROR:", e);

    return NextResponse.json(
      {
        error:
          e?.issues?.[0]?.message ||
          e?.message ||
          "Invalid test.",
      },
      { status: 400 }
    );
  }
}