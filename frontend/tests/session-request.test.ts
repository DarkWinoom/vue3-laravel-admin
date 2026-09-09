import assert from 'node:assert/strict';
import test from 'node:test';
import { createSessionRequest, SessionChangedError } from '../src/service/request/session-request.ts';

function setup() {
  const state = { token: 'account-a', identityRevision: 1 };
  let resets = 0;
  const options = {
    snapshot: () => ({ ...state }),
    code: (error: unknown) => (error instanceof Error ? error.message : undefined),
    refresh: async () => {
      state.token = 'account-a-rotated';
      return true;
    },
    reset: async () => {
      resets++;
      state.identityRevision++;
      state.token = '';
    }
  };
  return { state, options, resets: () => resets };
}

test('old successful responses cannot populate another account after switching', async () => {
  const { state, options } = setup();
  const response = Promise.withResolvers<string>();
  const pending = createSessionRequest(options)(() => response.promise);
  state.identityRevision++;
  state.token = 'account-b';
  response.resolve('private account-a data');
  await assert.rejects(pending, SessionChangedError);
});

test('an expired write from another account is never replayed with the new token', async () => {
  const { state, options, resets } = setup();
  const response = Promise.withResolvers<string>();
  const sent: string[] = [];
  const pending = createSessionRequest(options)(token => {
    sent.push(token);
    return response.promise;
  });
  state.identityRevision++;
  state.token = 'account-b';
  response.reject(new Error('TOKEN_EXPIRED'));
  await assert.rejects(pending, SessionChangedError);
  assert.deepEqual(sent, ['account-a']);
  assert.equal(resets(), 0);
  assert.equal(state.token, 'account-b');
});

test('changing identity while refresh is pending prevents retry and logout of the new account', async () => {
  const { state, options, resets } = setup();
  const refresh = Promise.withResolvers<boolean>();
  const started = Promise.withResolvers<void>();
  options.refresh = () => {
    started.resolve();
    return refresh.promise;
  };
  let sends = 0;
  const pending = createSessionRequest(options)(async () => {
    sends++;
    throw new Error('TOKEN_EXPIRED');
  });
  await started.promise;
  state.identityRevision++;
  state.token = 'account-b';
  refresh.resolve(false);
  await assert.rejects(pending, SessionChangedError);
  assert.equal(sends, 1);
  assert.equal(resets(), 0);
});

test('rotation within one identity retries once with the fresh access token', async () => {
  const { options } = setup();
  const sent: string[] = [];
  const result = await createSessionRequest(options)(async token => {
    sent.push(token);
    if (sent.length === 1) throw new Error('TOKEN_EXPIRED');
    return 'saved';
  });
  assert.equal(result, 'saved');
  assert.deepEqual(sent, ['account-a', 'account-a-rotated']);
});

test('failed renewal clears the current identity and does not retry indefinitely', async () => {
  const { state, options, resets } = setup();
  options.refresh = async () => {
    state.token = '';
    return false;
  };
  await assert.rejects(
    createSessionRequest(options)(async () => {
      throw new Error('TOKEN_EXPIRED');
    }),
    /TOKEN_EXPIRED/
  );
  assert.equal(resets(), 1);
  assert.equal(state.token, '');
});
