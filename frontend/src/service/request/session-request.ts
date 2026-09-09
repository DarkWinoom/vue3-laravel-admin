interface SessionSnapshot {
  token: string;
  identityRevision: number;
}

interface SessionRequestOptions {
  snapshot: () => SessionSnapshot;
  code: (error: unknown) => string | undefined;
  refresh: () => Promise<boolean>;
  reset: () => Promise<void>;
}

export class SessionChangedError extends Error {
  constructor() {
    super('登录身份已变化，已取消旧会话请求');
  }
}

/** A token rotation may retry a request; changing accounts must never do so. */
export function createSessionRequest(options: SessionRequestOptions) {
  return async function execute<T>(operation: (token: string) => Promise<T>, retried = false): Promise<T> {
    const sent = options.snapshot();
    const assertCurrent = () => {
      if (sent.identityRevision !== options.snapshot().identityRevision) throw new SessionChangedError();
    };
    try {
      const response = await operation(sent.token);
      assertCurrent();
      return response;
    } catch (error) {
      assertCurrent();
      const code = options.code(error);
      if (code === 'TOKEN_EXPIRED' && !retried) {
        const current = options.snapshot();
        const refreshed = (sent.token !== current.token && Boolean(current.token)) || (await options.refresh());
        assertCurrent();
        if (refreshed) return execute(operation, true);
      }
      if (['TOKEN_EXPIRED', 'SESSION_REVOKED', 'UNAUTHENTICATED'].includes(code ?? '')) await options.reset();
      throw error;
    }
  };
}
