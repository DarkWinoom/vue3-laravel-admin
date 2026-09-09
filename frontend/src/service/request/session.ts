import { reactive } from 'vue';
import { localStg } from '@/utils/storage';

export const isDesktop = '__TAURI_INTERNALS__' in window;
export const sessionState = reactive({ token: '', refreshToken: '', csrf: '', revision: 0, identityRevision: 0 });

export function csrfToken() {
  return isDesktop
    ? sessionState.csrf
    : decodeURIComponent(
        document.cookie
          .split('; ')
          .find(value => value.startsWith('csrf_token='))
          ?.slice(11) ?? ''
      );
}
export function setSession(tokens: Api.Auth.LoginToken, newIdentity = true) {
  if (newIdentity) sessionState.identityRevision += 1;
  sessionState.token = tokens.token;
  sessionState.refreshToken = isDesktop ? (tokens.refreshToken ?? '') : '';
  sessionState.csrf = tokens.csrfToken;
  sessionState.revision += 1;
}
export function clearSession(endIdentity = true) {
  if (endIdentity) sessionState.identityRevision += 1;
  sessionState.token = '';
  sessionState.refreshToken = '';
  sessionState.csrf = '';
  sessionState.revision += 1;
  localStg.remove('token');
  localStg.remove('refreshToken');
}
clearSession();
