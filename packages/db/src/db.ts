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

export const databaseConfig = getDatabaseConfig();

export const db =
  databaseConfig.provider === "neon"
    ? drizzleNeon(neon(databaseConfig.connectionString), { schema })
    : drizzlePostgres(postgres(databaseConfig.connectionString), { schema });