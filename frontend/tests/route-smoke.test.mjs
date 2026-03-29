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
  assert.match(login, /socialLogin\('google'\)/);
  assert.match(login, /socialLogin\('facebook'\)/);
  assert.match(login, /Google/);
  assert.match(login, /Facebook/);
  assert.match(login, /resolveDestinationForRole/);
  assert.match(login, /resolveLoginNotice/);

  const adminLogin = await readAppFile('admin/login/page.jsx');
  assert.match(adminLogin, /Admin Access/);
  assert.match(adminLogin, /Password Only/);
  assert.match(adminLogin, /resolveDestinationForRole/);
  assert.match(adminLogin, /isAdminRole/);
  assert.doesNotMatch(adminLogin, /Continue with Google/);
  assert.doesNotMatch(adminLogin, /Continue with Facebook/);

  const adminPage = await readAppFile('admin/page.jsx');
  assert.match(adminPage, /AdminShell/);

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
  assert.match(enrollPage, /slip_image/);
  assert.match(enrollPage, /readAuthToken/);

  const navbar = await readAppFile('_components/navbar.jsx');
  assert.match(navbar, /My Courses/);
  assert.match(navbar, /Log In/);
  assert.match(navbar, /readAuthToken/);
  assert.match(navbar, /\/admin/);

  const adminCourses = await readAppFile('admin/courses/page.jsx');
  assert.match(adminCourses, /\/api\/admin\/courses/);
  assert.match(adminCourses, /apiFetch/);

  const adminLessons = await readAppFile('admin/courses/[id]/lessons/page.jsx');
  assert.match(adminLessons, /\/api\/admin\/courses/);
  assert.match(adminLessons, /bunny_video_id/);

  const adminStudents = await readAppFile('admin/students/page.jsx');
  assert.match(adminStudents, /\/api\/admin\/students/);
  assert.match(adminStudents, /enrollment_count/);

  const learnPage = await readAppFile('learn/[slug]/page.jsx');
  assert.match(learnPage, /\/api\/lessons/);
  assert.match(learnPage, /video-url/);
  assert.match(learnPage, /signed_url/);
  assert.match(learnPage, /apiFetch/);
  assert.match(learnPage, /session_expired/);

  const forgotPage = await readAppFile('forgot-password/page.jsx');
  assert.match(forgotPage, /forgot-password/);
  assert.match(forgotPage, /\/api\/auth\/forgot-password/);

  const resetPage = await readAppFile('reset-password/page.jsx');
  assert.match(resetPage, /reset-password/);
  assert.match(resetPage, /\/api\/auth\/reset-password/);
  assert.match(resetPage, /password_confirmation/);
}
