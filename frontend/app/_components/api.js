import { readAuthToken } from './auth-session';

/**
 * Thin wrapper around fetch. Adds Accept and Authorization headers automatically.
 * Options are passed through to fetch unchanged (except headers, which are merged).
 */
export async function apiFetch(path, options = {}) {
  const token = readAuthToken();
  const headers = { Accept: 'application/json', ...options.headers };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(path, { ...options, headers });
}

export function buildJsonRequest(body) {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}
