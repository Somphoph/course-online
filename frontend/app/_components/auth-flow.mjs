export function resolveDestinationForRole(role) {
  return role === 'admin' ? '/admin' : '/dashboard';
}

export function resolveLoginNotice(error) {
  switch (error) {
    case 'cancelled':
      return 'Social sign in was cancelled. You can try again below.';
    case 'email_required':
      return 'Google or Facebook did not return an email address.';
    case 'session_expired':
      return 'Your session expired. Please sign in again.';
    case 'forbidden':
      return 'This account does not have admin access.';
    default:
      return '';
  }
}

export function isAdminRole(role) {
  return role === 'admin';
}
