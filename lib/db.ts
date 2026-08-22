import { Pool, PoolClient } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const globalForDb = globalThis as unknown as {
  pgPool?: Pool;
};

const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

export async function query<T = any>(
  text: string,
  values: any[] = []
): Promise<{ rows: T[]; rowCount: number }> {
  const result = await pool.query(text, values);
  return {
    rows: result.rows as T[],
    rowCount: result.rowCount ?? 0,
  };
}

export async function get<T = any>(
  text: string,
  values: any[] = []
): Promise<T | undefined> {
  const result = await pool.query(text, values);
  return result.rows[0] as T | undefined;
}

export async function all<T = any>(
  text: string,
  values: any[] = []
): Promise<T[]> {
  const result = await pool.query(text, values);
  return result.rows as T[];
}

export async function run(
  text: string,
  values: any[] = []
) {
  return pool.query(text, values);
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
