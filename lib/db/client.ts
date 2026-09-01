import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";
import { getAppDispatcher } from "../proxyFetch";
import { fetch as undiciFetch } from "undici";

export const getD1ApiUrl = () =>
  `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_D1_DATABASE_ID}/query`;

/**
 * Execute raw DDL / SQL query against Cloudflare D1 HTTP API.
 */
export async function executeD1Sql(sql: string, params: unknown[] = []): Promise<unknown> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    return null;
  }

  try {
    const res = await undiciFetch(getD1ApiUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
      dispatcher: getAppDispatcher(),
    });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

/**
 * High-performance direct typed SQL query against Cloudflare D1 HTTP API.
 */
export async function queryD1<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    throw new Error(
      "Cloudflare D1 credentials missing. Please set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_API_TOKEN."
    );
  }

  const res = await undiciFetch(getD1ApiUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
    dispatcher: getAppDispatcher(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`D1 HTTP API error: ${res.status} – ${err}`);
  }

  const json = (await res.json()) as {
    success: boolean;
    errors: { message: string }[];
    result: { results: T[]; success: boolean }[];
  };

  if (!json.success || json.errors?.length > 0) {
    throw new Error(
      `D1 query error: ${json.errors?.map((e) => e.message).join(", ")}`
    );
  }

  return json.result?.[0]?.results ?? [];
}

/**
 * Execute a SQL query against Cloudflare D1 via HTTP API for Drizzle ORM.
 */
async function d1Fetch(
  sql: string,
  params: unknown[],
  method: "run" | "all" | "values"
): Promise<{ rows: unknown[][] }> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    throw new Error(
      "Cloudflare D1 credentials missing. Please set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_API_TOKEN."
    );
  }

  const res = await undiciFetch(getD1ApiUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
    dispatcher: getAppDispatcher(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`D1 HTTP API error: ${res.status} – ${err}`);
  }

  const json = (await res.json()) as {
    success: boolean;
    errors: { message: string }[];
    result: { results: Record<string, unknown>[]; success: boolean }[];
  };

  if (!json.success || json.errors?.length > 0) {
    throw new Error(
      `D1 query error: ${json.errors?.map((e) => e.message).join(", ")}`
    );
  }

  const result = json.result?.[0];
  if (!result) return { rows: [] };

  if (method === "run") return { rows: [] };

  // Convert object rows to array rows for Drizzle compatibility
  const rows = result.results ?? [];
  if (rows.length === 0) return { rows: [] };

  const keys = Object.keys(rows[0]);
  return {
    rows: rows.map((row) => keys.map((k) => row[k])),
  };
}

// Drizzle sqlite-proxy client
export const db = drizzle(
  async (sql, params, method) => {
    return d1Fetch(sql, params, method as "run" | "all" | "values");
  },
  { schema }
);

export type DB = typeof db;

