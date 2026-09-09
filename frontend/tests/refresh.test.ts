import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSessionRefresh } from '../src/service/request/refresh.ts';

test('concurrent expired requests share one refresh and later requests can refresh again', async () => {
  let calls = 0;
  let revision = 0;
  const applied: string[] = [];
  const refresh = createSessionRefresh({
    revision: () => revision,
    renew: async () => {
      calls += 1;
      return 'token';
    },
    apply: value => {
      applied.push(value);
      revision += 1;
    },
    clear: () => assert.fail('successful refresh must not clear the session')
  });
  assert.deepEqual(await Promise.all([refresh(), refresh(), refresh()]), [true, true, true]);
  assert.equal(calls, 1);
  assert.deepEqual(applied, ['token']);
  assert.equal(await refresh(), true);
  assert.equal(calls, 2);
});

test('a completed old refresh cannot restore a logged-out or replaced session', async () => {
  let revision = 0;
  let finish: (value: string) => void = () => {};
  const refresh = createSessionRefresh({
    revision: () => revision,
    renew: () =>
      new Promise<string>(resolve => {
        finish = resolve;
      }),
    apply: () => assert.fail('stale response restored credentials'),
    clear: () => assert.fail('stale response cleared current credentials')
  });
  const pending = refresh();
  revision += 1;
  finish('old-token');
  assert.equal(await pending, false);
});

test('failed refresh clears the session once for concurrent callers', async () => {
  let cleared = 0;
  const refresh = createSessionRefresh({
    revision: () => 0,
    renew: async () => {
      throw new Error('revoked');
    },
    apply: () => assert.fail('failed response applied'),
    clear: () => {
      cleared += 1;
    }
  });
  assert.deepEqual(await Promise.all([refresh(), refresh()]), [false, false]);
  assert.equal(cleared, 1);
});

test('a failed old refresh does not clear a new login', async () => {
  let revision = 0;
  let fail: (reason: Error) => void = () => {};
  const refresh = createSessionRefresh({
    revision: () => revision,
    renew: () =>
      new Promise<string>((_resolve, reject) => {
        fail = reject;
      }),
    apply: () => assert.fail('unexpected credentials'),
    clear: () => assert.fail('new login was cleared')
  });
  const pending = refresh();
  revision += 1;
  fail(new Error('expired'));
  assert.equal(await pending, false);
});
