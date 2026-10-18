// First-boot admin for an authenticated/public Paperclip.
//
// Public exposure disables the browser "claim this instance" step, and the
// CLI bootstrap prints an invite URL into the logs. Instead: once the server
// is up and no instance admin exists, sign up ADMIN_EMAIL through Paperclip's
// own auth API and grant that user the instance_admin role, which is what the
// claim does on a fresh instance (no companies yet, so no memberships).
//
// Sign-up stays open so company invites keep working, but an account alone
// grants nothing: creating companies needs instance admin.
import { createRequire } from "node:module";

const require = createRequire("/app/packages/db/package.json");
const postgres = require("postgres");

const { ADMIN_EMAIL, ADMIN_PASSWORD, DATABASE_URL, PAPERCLIP_PUBLIC_URL } = process.env;
const base = `http://127.0.0.1:${process.env.PORT || 3100}`;
const log = (msg) => console.log(`[railway-seed-admin] ${msg}`);

async function waitForHealth() {
  for (let i = 0; i < 300; i++) {
    try {
      const res = await fetch(`${base}/api/health`);
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

async function auth(path, body) {
  const res = await fetch(`${base}/api/auth/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: PAPERCLIP_PUBLIC_URL },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    log("ADMIN_EMAIL or ADMIN_PASSWORD not set; skipping");
    return;
  }
  if (!(await waitForHealth())) {
    log("server never became healthy; skipping");
    return;
  }
  const sql = postgres(DATABASE_URL, { max: 1, onnotice: () => {} });
  try {
    const [{ count }] = await sql`select count(*)::int as count from instance_user_roles where role = 'instance_admin'`;
    if (count > 0) return;

    const email = ADMIN_EMAIL.trim().toLowerCase();
    let res = await auth("sign-up/email", { email, password: ADMIN_PASSWORD, name: email.split("@")[0] });
    if (!res.ok) {
      // Already registered (an earlier boot got this far): only promote the
      // account if ADMIN_PASSWORD actually signs in to it.
      res = await auth("sign-in/email", { email, password: ADMIN_PASSWORD });
      if (!res.ok) {
        log(`could not create or sign in ${email} (HTTP ${res.status}); open the app and sign up manually`);
        return;
      }
    }
    const userId = res.json?.user?.id;
    if (!userId) {
      log("auth response had no user id; skipping");
      return;
    }
    const granted = await sql`
      insert into instance_user_roles (user_id, role)
      select ${userId}, 'instance_admin'
      where not exists (select 1 from instance_user_roles where role = 'instance_admin')
      on conflict do nothing
      returning id`;
    log(granted.length ? `${email} is the instance admin` : "an instance admin already exists");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => log(`failed: ${err.message}`));
