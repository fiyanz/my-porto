import test from 'node:test';
import assert from 'node:assert/strict';
import { getServerApiUrl } from './api.ts';

test('getServerApiUrl defaults to http://server:8000 when NEXT_PUBLIC_API_URL is unset', () => {
  const originalPublic = process.env.NEXT_PUBLIC_API_URL;
  const originalBackend = process.env.BACKEND_URL;
  delete process.env.NEXT_PUBLIC_API_URL;
  delete process.env.BACKEND_URL;

  assert.equal(getServerApiUrl(), 'http://server:8000');

  process.env.NEXT_PUBLIC_API_URL = originalPublic;
  process.env.BACKEND_URL = originalBackend;
});

test('getServerApiUrl returns BACKEND_URL when NEXT_PUBLIC_API_URL is relative', () => {
  const originalPublic = process.env.NEXT_PUBLIC_API_URL;
  const originalBackend = process.env.BACKEND_URL;
  process.env.NEXT_PUBLIC_API_URL = '/api';
  process.env.BACKEND_URL = 'http://backend-internal:8000';

  assert.equal(getServerApiUrl(), 'http://backend-internal:8000');

  process.env.NEXT_PUBLIC_API_URL = originalPublic;
  process.env.BACKEND_URL = originalBackend;
});

test('getServerApiUrl returns absolute URL as is', () => {
  const originalPublic = process.env.NEXT_PUBLIC_API_URL;
  process.env.NEXT_PUBLIC_API_URL = 'https://porto.example.com';

  assert.equal(getServerApiUrl(), 'https://porto.example.com');

  process.env.NEXT_PUBLIC_API_URL = originalPublic;
});
