import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readAppFile(relativePath) {
  return readFile(path.join(__dirname, '..', 'app', relativePath), 'utf8');
}

export async function runRouteSmokeTests() {
  const root = await readAppFile('page.jsx');
  assert.match(root, /redirect\('\/login'\)/);

  const login = await readAppFile('login/page.jsx');
  assert.match(login, /Continue with Google/);
  assert.match(login, /Continue with Facebook/);
  assert.match(login, /resolveDestinationForRole/);
  assert.match(login, /resolveLoginNotice/);

  const adminLogin = await readAppFile('admin/login/page.jsx');
  assert.match(adminLogin, /Admin access/);
  assert.match(adminLogin, /Password-only/);
  assert.match(adminLogin, /resolveDestinationForRole/);
  assert.match(adminLogin, /isAdminRole/);
  assert.doesNotMatch(adminLogin, /Continue with Google/);
  assert.doesNotMatch(adminLogin, /Continue with Facebook/);

  const adminPage = await readAppFile('admin/page.jsx');
  assert.match(adminPage, /AdminAccessGate/);

  const callback = await readAppFile('auth/callback/page.jsx');
  assert.match(callback, /resolveDestinationForRole/);
  assert.match(callback, /writeAuthToken/);

  const apiHelper = await readAppFile('_components/api.js');
  assert.match(apiHelper, /apiFetch/);
  assert.match(apiHelper, /Authorization/);
}
