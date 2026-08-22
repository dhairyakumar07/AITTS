import { NextResponse } from "next/server";
import { get, all, run } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const testId = Number(id);

  const test = await get(
    "SELECT * FROM tests WHERE id=$1",
    [testId]
  );

  if (!test) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  const questions = await all(
    `SELECT *
     FROM questions
     WHERE test_id=$1
     ORDER BY sort_order`,
    [testId]
  );

  const options = await all(
    `SELECT *
     FROM options
     WHERE question_id IN (
       SELECT id FROM questions WHERE test_id=$1
     )
     ORDER BY question_id,option_order`,
    [testId]
  );

  const answers = await all(
    `SELECT *
     FROM correct_answers
     WHERE question_id IN (
       SELECT id FROM questions WHERE test_id=$1
     )`,
    [testId]
  );

  return NextResponse.json({
    test,
    questions: questions.map((q: any) => ({
      ...q,
      options: options.filter(
        (o: any) => Number(o.question_id) === Number(q.id)
      ),
      correctOptions: answers
        .filter(
          (a: any) => Number(a.question_id) === Number(q.id)
        )
        .map((a: any) => Number(a.option_id)),
    })),
  });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const body = await req.json();

  if (
    body.status &&
    !["DRAFT", "PUBLISHED", "ACTIVE", "CLOSED"].includes(body.status)
  ) {
    return NextResponse.json(
      { error: "Invalid status" },
      { status: 400 }
    );
  }

  await run(
    `UPDATE tests
     SET
       status=COALESCE($1,status),
       show_answer_key=COALESCE($2,show_answer_key),
       updated_at=CURRENT_TIMESTAMP
     WHERE id=$3`,
    [
      body.status ?? null,
      typeof body.showAnswerKey === "boolean"
        ? body.showAnswerKey
        : null,
      Number(id),
    ]
  );

  return NextResponse.json({ ok: true });
}
