import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "./schema";

export type DbProvider = "local" | "neon";

export interface DatabaseConfig {
  provider: DbProvider;
  connectionString: string;
}

type DbClient =
  | ReturnType<typeof drizzleNeon<typeof schema>>
  | ReturnType<typeof drizzlePostgres<typeof schema>>;

export function getDatabaseConfig(): DatabaseConfig {
  const configuredProvider = process.env.DB_PROVIDER;
  const hasNeonUrl = Boolean(process.env.NEON_DATABASE_URL);
  const provider: DbProvider =
    configuredProvider === "neon" || (!configuredProvider && hasNeonUrl)
      ? "neon"
      : "local";

  const connectionString =
    provider === "neon"
      ? process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL ?? ""
      : process.env.DATABASE_URL ?? "";

  if (!connectionString) {
    throw new Error(
      provider === "neon"
        ? "Missing NEON_DATABASE_URL or DATABASE_URL for Neon connection."
        : "Missing DATABASE_URL for local Postgres connection.",
    );
  }

  return {
    provider,
    connectionString,
  };
}

let cachedConfig: DatabaseConfig | undefined;
let cachedDb: DbClient | undefined;

export function getDb(): DbClient {
  if (cachedDb) {
    return cachedDb;
  }

  cachedConfig = getDatabaseConfig();
  cachedDb =
    cachedConfig.provider === "neon"
      ? drizzleNeon(neon(cachedConfig.connectionString), { schema })
      : drizzlePostgres(postgres(cachedConfig.connectionString), { schema });

  return cachedDb;
}

export function getResolvedDatabaseConfig(): DatabaseConfig {
  if (!cachedConfig) {
    cachedConfig = getDatabaseConfig();
  }

  return cachedConfig;
}

export const db = new Proxy({} as DbClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
}) as DbClient;