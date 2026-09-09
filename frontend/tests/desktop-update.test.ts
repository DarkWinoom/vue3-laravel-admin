import assert from 'node:assert/strict';
import { test } from 'node:test';
import { effectScope } from 'vue';
import { useDesktopUpdate } from '../src/components/desktop/use-desktop-update.ts';

test('updater reports network failure and permits a fresh check', async () => {
  let calls = 0;
  const scope = effectScope();
  const update = scope.run(() =>
    useDesktopUpdate(
      {
        check: async () => {
          if (++calls === 1) throw Error('offline');
          return null;
        },
        relaunch: async () => assert.fail('unexpected restart')
      },
      '0.1.0'
    )
  )!;
  await update.checkUpdate();
  assert.equal(update.state.value, 'error');
  await update.checkUpdate();
  assert.equal(update.state.value, 'idle');
  assert.equal(calls, 2);
  scope.stop();
});

test('failed signature/download never becomes ready and can retry', async () => {
  let attempts = 0;
  let restarts = 0;
  let closed = 0;
  const scope = effectScope();
  const update = scope.run(() =>
    useDesktopUpdate(
      {
        check: async () => ({
          version: '0.1.1',
          body: 'Test',
          close: async () => {
            closed++;
          },
          downloadAndInstall: async onEvent => {
            if (++attempts === 1) throw Error('invalid signature');
            onEvent?.({ event: 'Started', data: { contentLength: 100 } });
            onEvent?.({ event: 'Progress', data: { chunkLength: 100 } });
          }
        }),
        relaunch: async () => {
          restarts++;
        }
      },
      '0.1.0'
    )
  )!;
  await update.checkUpdate();
  await update.installUpdate();
  assert.equal(update.state.value, 'error');
  await update.restart();
  assert.equal(restarts, 0);
  await update.installUpdate();
  assert.equal(update.state.value, 'ready');
  assert.equal(update.progress.value, 100);
  await update.installUpdate();
  assert.equal(attempts, 2);
  await update.restart();
  assert.equal(restarts, 1);
  scope.stop();
  assert.equal(closed, 1);
});

test('a check finishing after scope disposal releases its native resource', async () => {
  let resolve!: (value: any) => void;
  let closed = 0;
  const scope = effectScope();
  const update = scope.run(() =>
    useDesktopUpdate(
      {
        check: () =>
          new Promise(done => {
            resolve = done;
          }),
        relaunch: async () => {}
      },
      '0.1.0'
    )
  )!;
  const pending = update.checkUpdate();
  await Promise.resolve();
  await Promise.resolve();
  scope.stop();
  resolve({
    version: '0.1.1',
    close: async () => {
      closed++;
    }
  });
  await pending;
  assert.equal(closed, 1);
  assert.equal(update.release.value, null);
});

test('disposing during download defers resource close until native work finishes', async () => {
  let finish!: () => void;
  let closed = 0;
  const scope = effectScope();
  const update = scope.run(() =>
    useDesktopUpdate(
      {
        check: async () => ({
          version: '0.1.1',
          close: async () => {
            closed++;
          },
          downloadAndInstall: () =>
            new Promise<void>(done => {
              finish = done;
            })
        }),
        relaunch: async () => {}
      },
      '0.1.0'
    )
  )!;
  await update.checkUpdate();
  const pending = update.installUpdate();
  assert.equal(update.busy.value, true);
  scope.stop();
  assert.equal(closed, 0);
  finish();
  await pending;
  assert.equal(closed, 1);
});
