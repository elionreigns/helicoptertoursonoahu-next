import fs from 'fs';

const lines = fs.readFileSync('.env.vercel.production', 'utf8').split(/\r?\n/);
const env = {};
for (const line of lines) {
  const eq = line.indexOf('=');
  if (eq === -1 || line.startsWith('#')) continue;
  const key = line.slice(0, eq);
  let val = line.slice(eq + 1);
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[key] = val;
}

const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const resend = env.RESEND_API_KEY;

if (!url || !key) {
  console.log('MISSING_SUPABASE_ENV');
  process.exit(1);
}

console.log('SUPABASE_HOST:', new URL(url).hostname);
console.log('RESEND_CONFIGURED:', Boolean(resend?.trim()));

try {
  const r = await fetch(`${url}/rest/v1/bookings?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  console.log('SUPABASE_HTTP:', r.status);
  const body = await r.text();
  console.log('SUPABASE_BODY:', body.slice(0, 200));
} catch (e) {
  console.log('SUPABASE_FETCH_ERROR:', e.cause?.code || e.message);
}

if (resend?.trim()) {
  try {
    const r2 = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${resend}` },
    });
    console.log('RESEND_API_HTTP:', r2.status);
    const body2 = await r2.text();
    console.log('RESEND_API_BODY:', body2.slice(0, 150));
  } catch (e) {
    console.log('RESEND_FETCH_ERROR:', e.message);
  }
}
