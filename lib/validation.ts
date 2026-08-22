import { z } from "zod";

export const signupSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(160), password: z.string().min(8).max(128) });
export const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(128) });
export const questionSchema = z.object({
  questionText: z.string().trim().min(1).max(5000),
  questionType: z.enum(["SCQ", "MCQ"]),
  marks: z.number().positive().max(100),
  negativeMarks: z.number().min(0).max(100),
  options: z.array(z.string().trim().min(1).max(1000)).min(2).max(6),
  correctIndexes: z.array(z.number().int().min(0).max(5)).min(1)
});
export const testSchema = z.object({
  title: z.string().trim().min(2).max(160), description: z.string().max(2000).optional().default(""), subject: z.string().trim().min(1).max(80),
  durationMinutes: z.number().int().min(1).max(600), accessCode: z.string().trim().min(4).max(40).regex(/^[A-Za-z0-9_-]+$/),
  startTime: z.string().nullable().optional(), endTime: z.string().nullable().optional(), allowReattempt: z.boolean().default(false), maxAttempts: z.number().int().min(1).max(20), showAnswerKey: z.boolean().default(false),
  questions: z.array(questionSchema).min(1).max(500)
});
