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
  assert.match(root, /\/api\/courses/);
  assert.match(root, /courses\/\$\{course\.slug\}/);

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

  const courseDetail = await readAppFile('courses/[slug]/page.jsx');
  assert.match(courseDetail, /\/api\/courses\/\$\{slug\}/);
  assert.match(courseDetail, /enroll/);
  assert.match(courseDetail, /formatDuration/);

  const dashboard = await readAppFile('dashboard/page.jsx');
  assert.match(dashboard, /apiFetch/);
  assert.match(dashboard, /\/api\/enrollments/);
  assert.match(dashboard, /session_expired/);

  const enrollPage = await readAppFile('courses/[slug]/enroll/page.jsx');
  assert.match(enrollPage, /\/api\/enrollments/);
  assert.match(enrollPage, /FormData/);
  assert.match(enrollPage, /slip/);
  assert.match(enrollPage, /readAuthToken/);
}
