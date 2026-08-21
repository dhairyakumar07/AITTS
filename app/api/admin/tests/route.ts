import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
export async function GET(){ const s=await getSession(); if(!s||s.role!=="ADMIN") return NextResponse.json({error:"Unauthorized"},{status:403});
 const tests=db.prepare(`SELECT t.*, (SELECT COUNT(*) FROM questions q WHERE q.test_id=t.id) question_count,(SELECT COUNT(*) FROM attempts a WHERE a.test_id=t.id) attempt_count FROM tests t ORDER BY t.created_at DESC`).all(); return NextResponse.json({tests}); }
