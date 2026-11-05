import assert from 'node:assert/strict';
import test from 'node:test';
import { httpsRedirect } from '../src/request-policy.server.ts';

test('production HTTP preserves path and attribution parameters in a permanent redirect', () => {
  const response = httpsRedirect(
    new Request('http://aibabydancing.com/thiago-navarro?utm_source=google&x=a%2Fb'),
    'https://aibabydancing.com',
  );
  assert.equal(response?.status, 308);
  assert.equal(
    response?.headers.get('location'),
    'https://aibabydancing.com/thiago-navarro?utm_source=google&x=a%2Fb',
  );
});

test('HTTPS does not loop and local/preview hosts remain usable over HTTP', () => {
  for (const url of [
    'https://aibabydancing.com/',
    'http://localhost:5030/',
    'http://127.0.0.1:5030/',
    'http://preview.example.com/',
    'http://aibabydancing.com.evil.example/',
  ]) {
    assert.equal(httpsRedirect(new Request(url), 'https://aibabydancing.com'), undefined);
  }
});

test('POST redirects preserve the method through status 308', () => {
  const response = httpsRedirect(
    new Request('http://aibabydancing.com/api/example', { method: 'POST', body: 'data' }),
    'https://aibabydancing.com',
  );
  assert.equal(response?.status, 308);
});
