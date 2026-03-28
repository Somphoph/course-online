export const AUTH_TOKEN_KEY = 'course-online-token';

export const fixtures = {
  courses: [
    {
      slug: 'excel-basics',
      title: 'Excel Basics',
      description: 'Build formulas, tables, and clean workflows.',
      price: 1290,
      thumbnail: 'https://example.com/excel.jpg',
    },
  ],
  enrollments: [
    {
      id: 101,
      status: 'approved',
      created_at: '2026-03-25T08:00:00.000Z',
      course: {
        slug: 'excel-basics',
        title: 'Excel Basics',
      },
    },
  ],
  pendingEnrollments: [
    {
      id: 201,
      created_at: '2026-03-26T08:00:00.000Z',
      user: { name: 'Ada Student', email: 'ada@example.com' },
      course: { title: 'Excel Basics', price: 1290 },
    },
  ],
};

export async function mockApi(page, overrides = {}) {
  const state = {
    approvals: new Set(),
    rejections: new Set(),
    ...overrides,
  };

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname, searchParams } = url;
    const method = route.request().method();
    const authHeader = route.request().headers().authorization;

    const json = (status, body) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    if (method === 'GET' && pathname === '/api/courses') {
      await json(200, { data: fixtures.courses });
      return;
    }

    if (method === 'POST' && pathname === '/api/auth/login') {
      const payload = JSON.parse(route.request().postData() || '{}');
      const role = payload.email?.includes('admin') ? 'admin' : 'student';
      await json(200, {
        token: `${role}-token`,
        user: {
          id: role === 'admin' ? 1 : 2,
          name: role === 'admin' ? 'Admin User' : 'Student User',
          email: payload.email,
          role,
        },
      });
      return;
    }

    if (method === 'POST' && pathname === '/api/auth/register') {
      await json(200, {
        token: 'student-token',
        user: {
          id: 2,
          name: 'Student User',
          email: 'student@example.com',
          role: 'student',
        },
      });
      return;
    }

    if (method === 'GET' && pathname === '/api/auth/me') {
      if (authHeader === 'Bearer admin-token') {
        await json(200, {
          user: { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
        });
        return;
      }

      if (authHeader === 'Bearer student-token') {
        await json(200, {
          user: { id: 2, name: 'Student User', email: 'student@example.com', role: 'student' },
        });
        return;
      }

      await route.fulfill({ status: 401, body: 'Unauthorized' });
      return;
    }

    if (method === 'GET' && pathname === '/api/enrollments') {
      if (authHeader !== 'Bearer student-token') {
        await route.fulfill({ status: 401, body: 'Unauthorized' });
        return;
      }

      await json(200, { data: fixtures.enrollments });
      return;
    }

    if (method === 'GET' && pathname === '/api/admin/enrollments') {
      if (authHeader !== 'Bearer admin-token') {
        await route.fulfill({ status: 401, body: 'Unauthorized' });
        return;
      }

      if (searchParams.get('status') === 'pending') {
        const pending = state.approvals.size > 0 ? [] : fixtures.pendingEnrollments;
        await json(200, { data: pending });
        return;
      }

      await json(200, { data: [] });
      return;
    }

    if (
      method === 'POST' &&
      (pathname.endsWith('/approve') || pathname.endsWith('/reject'))
    ) {
      if (authHeader !== 'Bearer admin-token') {
        await route.fulfill({ status: 401, body: 'Unauthorized' });
        return;
      }

      const id = Number(pathname.split('/').at(-2));

      if (pathname.endsWith('/approve')) {
        state.approvals.add(id);
      } else {
        state.rejections.add(id);
      }

      await route.fulfill({ status: 204, body: '' });
      return;
    }

    if (method === 'GET' && pathname.match(/^\/api\/admin\/enrollments\/\d+\/slip$/)) {
      if (authHeader !== 'Bearer admin-token') {
        await route.fulfill({ status: 401, body: 'Unauthorized' });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: 'fake-slip-image',
      });
      return;
    }

    await route.fulfill({ status: 404, body: 'Not mocked' });
  });
}

export async function setAuthToken(page, token) {
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: AUTH_TOKEN_KEY, value: token },
  );
}
