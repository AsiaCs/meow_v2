// Try several ways to reach the Supabase Postgres directly. Prints which works.
// Resolves Supabase hostnames via DoH (my local resolver is flaky) and passes
// the IP to pg while keeping TLS servername correct.
import { readFileSync } from "node:fs";
import pg from "pg";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const dbLine = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL"));
const rawUrl = dbLine.replace(/^DATABASE_URL\s*=\s*/, "").replace(/^"|"$/g, "");
const u = new URL(rawUrl);
const password = decodeURIComponent(u.password);
const REF = "eudyxsewszwytjedzrsv";

async function doh(host) {
  const r = await fetch(`https://1.1.1.1/dns-query?name=${host}&type=A`, {
    headers: { accept: "application/dns-json" },
  });
  const j = await r.json();
  const a = (j.Answer || []).find((x) => x.type === 1);
  return a ? a.data : null;
}

async function attempt(label, cfg) {
  const client = new pg.Client({ ...cfg, connectionTimeoutMillis: 12000 });
  try {
    await client.connect();
    const r = await client.query("select current_user, current_database()");
    console.log(`✅ ${label} -> user=${r.rows[0].current_user} db=${r.rows[0].current_database}`);
    await client.end();
    return { label, cfg };
  } catch (e) {
    console.log(`❌ ${label} -> ${e.message}`);
    try { await client.end(); } catch {}
    return null;
  }
}

const directHost = `db.${REF}.supabase.co`;
const directIp = await doh(directHost);
console.log(`DoH ${directHost} -> ${directIp}`);

const results = [];
// 1. Direct connection, port 5432, user "postgres", via resolved IP + TLS SNI
if (directIp) {
  results.push(await attempt("direct:5432 (postgres@IP)", {
    host: directIp, port: 5432, user: "postgres", password, database: "postgres",
    ssl: { rejectUnauthorized: false, servername: directHost },
  }));
}
// 2. Session pooler, port 5432, pooler username
results.push(await attempt("pooler:5432 (postgres.ref)", {
  host: "aws-0-us-east-1.pooler.supabase.com", port: 5432,
  user: `postgres.${REF}`, password, database: "postgres",
  ssl: { rejectUnauthorized: false },
}));
// 3. The original URL as-is (txn pooler 6543)
results.push(await attempt("original DATABASE_URL", { connectionString: rawUrl, ssl: { rejectUnauthorized: false } }));

const ok = results.find(Boolean);
if (ok) {
  console.log(`\nWORKING: ${ok.label}`);
} else {
  console.log("\nNo direct route worked — will fall back to SQL editor.");
  process.exitCode = 2;
}
