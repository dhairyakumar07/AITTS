import { NextResponse } from "next/server";
import { get, run } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  _req: Request,
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

  const test = await get(
    "SELECT * FROM tests WHERE id=$1",
    [testId]
  ) as any;

  if (
    !test ||
    !["PUBLISHED", "ACTIVE"].includes(test.status)
  ) {
    return NextResponse.json(
      { error: "Test unavailable." },
      { status: 400 }
    );
  }

  const now = new Date();

  if (test.start_time && now < new Date(test.start_time)) {
    return NextResponse.json(
      { error: "Test has not started yet." },
      { status: 400 }
    );
  }

  if (test.end_time && now > new Date(test.end_time)) {
    return NextResponse.json(
      { error: "Test has closed." },
      { status: 400 }
    );
  }

  const submitted = await get(
    `SELECT COUNT(*) AS c
     FROM attempts
     WHERE student_id=$1
       AND test_id=$2
       AND submitted_at IS NOT NULL`,
    [session.id, testId]
  ) as any;

  if (
    Number(submitted?.c || 0) >= Number(test.max_attempts)
  ) {
    return NextResponse.json(
      { error: "Attempt limit reached." },
      { status: 400 }
    );
  }

  const active = await get(
    `SELECT *
     FROM attempts
     WHERE student_id=$1
       AND test_id=$2
       AND submitted_at IS NULL
     ORDER BY id DESC
     LIMIT 1`,
    [session.id, testId]
  ) as any;

  if (active) {
    return NextResponse.json({
      attemptId: Number(active.id),
      expiresAt: active.expires_at,
    });
  }

  const latest = await get(
    `SELECT COALESCE(MAX(attempt_number),0) AS m
     FROM attempts
     WHERE student_id=$1 AND test_id=$2`,
    [session.id, testId]
  ) as any;

  const attemptNumber = Number(latest?.m || 0) + 1;

  const started = new Date();
  const expires = new Date(
    started.getTime() + Number(test.duration_minutes) * 60000
  );

  const r = await run(
    `INSERT INTO attempts(
      student_id,test_id,attempt_number,started_at,expires_at
    )
    VALUES($1,$2,$3,$4,$5)
    RETURNING id`,
    [
      session.id,
      testId,
      attemptNumber,
      started.toISOString(),
      expires.toISOString(),
    ]
  );

  return NextResponse.json({
    attemptId: Number(r.rows[0].id),
    expiresAt: expires.toISOString(),
  });
}
