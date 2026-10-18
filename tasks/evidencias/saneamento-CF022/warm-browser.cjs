// Environment preparation only. Then run the candidate browser.cjs byte-for-byte,
// including its UI registration/login and original navigation assertion.
const path = require('node:path');
const [frontend, , namespace] = process.argv.slice(2);
const { request } = require(path.join(frontend, 'node_modules/@playwright/test'));
const baseURL = 'http://127.0.0.1:3112';
(async () => {
  const deadline = Date.now() + 120000;
  let ready = false;
  while (Date.now() < deadline) {
    try { ready = (await fetch(`${baseURL}/auth`)).ok; } catch {}
    if (ready) break;
    // Same existing server readiness polling; no UI/animation wait is added.
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  if (!ready) throw Error('Next dev server not ready');
  const api = await request.newContext({ baseURL });
  try {
    const email = namespace + '-warm@example.invalid', senha = 'Synthetic-Cf022-2026';
    const register = await api.post('/api/auth/register', { data: { nome: 'Warmup sintético', email, senha } });
    if (register.status() !== 200) throw Error(`Warmup register: ${register.status()}`);
    const login = await api.post('/api/auth/login', { data: { email, senha } });
    if (login.status() !== 200) throw Error(`Warmup login: ${login.status()}`);
    const { token } = await login.json();
    const home = await api.get('/', { headers: { Cookie: `token=${token}` } });
    if (!home.ok() || new URL(home.url()).pathname !== '/') throw Error('Warmup did not compile home');
    console.log('Prepared home compilation through real BFF; no habits/goals created');
  } finally { await api.dispose(); }
  require('./browser.cjs');
})().catch(error => { console.error(error); process.exitCode = 1; });
