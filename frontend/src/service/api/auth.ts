import { request } from '../request';
import { isDesktop } from '../request/session';

export function fetchLogin(email: string, password: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/login',
    method: 'post',
    data: { email, password, client: isDesktop ? 'desktop' : 'web' }
  });
}
export function fetchGetUserInfo() {
  return request<Api.Auth.UserInfo>({ url: '/auth/me' });
}
export function fetchLogout() {
  return request({ url: '/auth/logout', method: 'post' });
}
