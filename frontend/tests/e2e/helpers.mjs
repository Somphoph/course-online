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
    {
      id: 10,
      slug: 'power-automate-101',
      title: 'Power Automate 101',
      description: 'Automate your workflows with ease.',
      price: 990,
      thumbnail: 'https://example.com/automate.jpg',
    },
  ],
  bundles: [
    {
      id: 1,
      title: 'Office Power Suite',
      description: 'Master Excel and Power Automate together.',
      price: 1990,
      savings: 290,
      thumbnail: 'https://example.com/bundle.jpg',
      courses: [
        { id: 1, slug: 'excel-basics', title: 'Excel Basics', price: 1290 },
        { id: 10, slug: 'power-automate-101', title: 'Power Automate 101', price: 990 },
      ],
    },
  ],
  bundleEnrollments: [
    {
      id: 301,
      status: 'approved',
      created_at: '2026-03-27T08:00:00.000Z',
      bundle: {
        id: 1,
        title: 'Office Power Suite',
        courses: [
          { id: 1, slug: 'excel-basics', title: 'Excel Basics' },
          { id: 10, slug: 'power-automate-101', title: 'Power Automate 101' },
        ],
      },
    },
  ],
  pendingBundleEnrollments: [
    {
      id: 401,
      status: 'pending',
      created_at: '2026-03-28T08:00:00.000Z',
      user: { name: 'Ada Student', email: 'ada@example.com' },
      bundle: { title: 'Office Power Suite' },
      payment: { amount: 1990 },
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
    bundleApprovals: new Set(),
    bundleRejections: new Set(),
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

    if (method === 'GET' && pathname === '/api/bundles') {
      await json(200, { data: fixtures.bundles });
      return;
    }

    if (method === 'GET' && pathname.match(/^\/api\/bundles\/\d+$/)) {
      const bundleId = Number(pathname.split('/').pop());
      const bundle = fixtures.bundles.find((b) => b.id === bundleId);
      if (bundle) {
        await json(200, { data: bundle });
      } else {
        await json(404, { message: 'Bundle not found' });
      }
      return;
    }

    if (method === 'GET' && pathname === '/api/bundle-enrollments') {
      if (authHeader !== 'Bearer student-token') {
        await route.fulfill({ status: 401, body: 'Unauthorized' });
        return;
      }
      await json(200, { data: fixtures.bundleEnrollments });
      return;
    }

    if (method === 'GET' && pathname === '/api/admin/bundles') {
      if (authHeader !== 'Bearer admin-token') {
        await route.fulfill({ status: 401, body: 'Unauthorized' });
        return;
      }
      await json(200, { data: fixtures.bundles });
      return;
    }

    if (method === 'GET' && pathname === '/api/admin/bundle-enrollments') {
      if (authHeader !== 'Bearer admin-token') {
        await route.fulfill({ status: 401, body: 'Unauthorized' });
        return;
      }
      const status = searchParams.get('status');
      if (status === 'pending') {
        const pending = state.bundleApprovals.size > 0 ? [] : fixtures.pendingBundleEnrollments;
        await json(200, { data: pending });
      } else {
        await json(200, { data: [] });
      }
      return;
    }

    if (
      method === 'POST' &&
      pathname.match(/^\/api\/admin\/bundle-enrollments\/\d+\/(approve|reject)$/)
    ) {
      if (authHeader !== 'Bearer admin-token') {
        await route.fulfill({ status: 401, body: 'Unauthorized' });
        return;
      }

      const id = Number(pathname.split('/').at(-2));

      if (pathname.endsWith('/approve')) {
        state.bundleApprovals.add(id);
      } else {
        state.bundleRejections.add(id);
      }

      await route.fulfill({ status: 204, body: '' });
      return;
    }

    if (method === 'GET' && pathname.match(/^\/api\/admin\/bundle-enrollments\/\d+\/slip$/)) {
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
  if (page.url() === 'about:blank') {
    await page.goto('/');
  }

  await page.evaluate(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: AUTH_TOKEN_KEY, value: token },
  );
}
