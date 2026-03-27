import assert from 'node:assert/strict';

import { isAdminRole, resolveDestinationForRole, resolveLoginNotice } from '../app/_components/auth-flow.mjs';

export function runAuthFlowTests() {
  assert.equal(resolveDestinationForRole('admin'), '/admin');

  assert.equal(resolveDestinationForRole('student'), '/dashboard');
  assert.equal(resolveDestinationForRole(undefined), '/dashboard');

  assert.equal(resolveLoginNotice('cancelled'), 'Social sign in was cancelled. You can try again below.');
  assert.equal(resolveLoginNotice('email_required'), 'Google or Facebook did not return an email address.');
  assert.equal(resolveLoginNotice('session_expired'), 'Your session expired. Please sign in again.');
  assert.equal(resolveLoginNotice('forbidden'), 'This account does not have admin access.');
  assert.equal(resolveLoginNotice('unknown'), '');

  assert.equal(isAdminRole('admin'), true);
  assert.equal(isAdminRole('student'), false);
  assert.equal(isAdminRole(undefined), false);
}
