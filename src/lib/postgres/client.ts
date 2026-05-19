import { Pool } from "pg";

let sharedPool: Pool | undefined;

export function createPostgresPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set for Postgres integration");
  }
  return new Pool({ connectionString });
}

export function getSharedPostgresPool(): Pool {
  if (!sharedPool) {
    sharedPool = createPostgresPool();
  }
  return sharedPool;
}
