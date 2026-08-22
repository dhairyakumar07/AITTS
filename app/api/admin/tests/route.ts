import { NextResponse } from "next/server";
import { all } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  const tests = await all(
    `SELECT
      t.*,
      (SELECT COUNT(*) FROM questions q WHERE q.test_id=t.id) AS question_count,
      (SELECT COUNT(*) FROM attempts a WHERE a.test_id=t.id) AS attempt_count
     FROM tests t
     ORDER BY t.created_at DESC`
  );

  return NextResponse.json({ tests });
}
