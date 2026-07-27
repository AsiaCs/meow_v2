// One-off READ-ONLY audit of the live Supabase Postgres DB.
// Lists tables, RLS status, and policies. No writes.
import { readFileSync } from "node:fs";
import pg from "pg";

// Load DATABASE_URL from .env.local without extra deps.
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const line = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL"));
const url = line.replace(/^DATABASE_URL\s*=\s*/, "").replace(/^"|"$/g, "");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

const q = (text, params) => client.query(text, params);

try {
  await client.connect();
  console.log("CONNECTED OK\n");

  const tables = await q(`
    select c.relname as table, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by c.relname;`);

  console.log("=== TABLES + RLS ===");
  for (const t of tables.rows) {
    console.log(`${t.rls_enabled ? "🔒" : "⚠️ OPEN"}  ${t.table}  (rls_enabled=${t.rls_enabled}, forced=${t.rls_forced})`);
  }

  const pols = await q(`
    select tablename, policyname, cmd, roles::text as roles,
           coalesce(qual,'') as using_expr, coalesce(with_check,'') as check_expr
    from pg_policies where schemaname='public' order by tablename, policyname;`);

  console.log("\n=== RLS POLICIES ===");
  if (!pols.rows.length) console.log("(none)");
  for (const p of pols.rows) {
    console.log(`${p.tablename}.${p.policyname} [${p.cmd}] roles=${p.roles}\n   USING: ${p.using_expr}\n   CHECK: ${p.check_expr}`);
  }

  // Row counts for context
  console.log("\n=== ROW COUNTS ===");
  for (const t of tables.rows) {
    try {
      const c = await q(`select count(*)::int as n from public."${t.table}"`);
      console.log(`${t.table}: ${c.rows[0].n}`);
    } catch (e) { console.log(`${t.table}: ERR ${e.message}`); }
  }

  // Does the signup trigger exist?
  const trig = await q(`
    select tgname from pg_trigger t join pg_class c on c.oid=t.tgrelid
    join pg_namespace n on n.oid=c.relnamespace
    where c.relname='users' and n.nspname='auth' and not t.tgisinternal;`);
  console.log("\n=== auth.users triggers ===");
  console.log(trig.rows.map(r => r.tgname).join(", ") || "(none)");

} catch (e) {
  console.error("AUDIT FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
