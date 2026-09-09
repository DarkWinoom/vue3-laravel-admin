import { computed, reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { fetchGetUserInfo, fetchLogin, fetchLogout } from '@/service/api';
import { refreshSession } from '@/service/request';
import { clearSession, csrfToken, isDesktop, sessionState, setSession } from '@/service/request/session';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';
import { desktopApiOrigin, desktopPanelVisible } from '@/desktop/connection';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const { toLogin, redirectFromLogin } = useRouterPush(false);
  const loginLoading = ref(false);
  const initialized = ref(false);
  const token = computed(() => sessionState.token);
  const isLogin = computed(() => Boolean(token.value));
  const isStaticSuper = computed(() => false);
  const userInfo = reactive<Api.Auth.UserInfo>({
    userId: '',
    userName: '',
    email: '',
    roles: [],
    buttons: [],
    accessVersion: 0
  });

  async function resetStore() {
    clearSession();
    Object.assign(userInfo, { userId: '', userName: '', email: '', roles: [], buttons: [], accessVersion: 0 });
    initialized.value = true;
    useTabStore().clearTabs();
    localStg.remove('globalTabs');
    await useRouteStore().resetStore();
    await toLogin();
  }
  async function getUserInfo() {
    const { data, error } = await fetchGetUserInfo();
    if (error) return false;
    Object.assign(userInfo, data);
    return true;
  }
  async function initUserInfo() {
    if (initialized.value) return;
    initialized.value = true;
    if (!token.value && !isDesktop && csrfToken()) await refreshSession();
    if (token.value) await getUserInfo();
  }
  async function login(email: string, password: string) {
    if (isDesktop && !desktopApiOrigin.value) {
      desktopPanelVisible.value = true;
      return;
    }
    loginLoading.value = true;
    try {
      const { data, error } = await fetchLogin(email, password);
      if (error) return;
      setSession(data);
      initialized.value = true;
      const identityRevision = sessionState.identityRevision;
      const hasIdentity = await getUserInfo();
      if (identityRevision !== sessionState.identityRevision) return;
      if (!hasIdentity) {
        await resetStore();
        return;
      }
      useTabStore().clearTabs();
      localStg.remove('globalTabs');
      await redirectFromLogin();
    } finally {
      loginLoading.value = false;
    }
  }
  async function logout() {
    const { error } = await fetchLogout();
    if (!error) await resetStore();
  }
  async function refreshAccess() {
    if (!(await getUserInfo())) return;
    useRouteStore().setIsInitAuthRoute(false);
    await useRouteStore().initAuthRoute();
  }
  return {
    token,
    userInfo,
    isLogin,
    isStaticSuper,
    loginLoading,
    resetStore,
    login,
    logout,
    initUserInfo,
    refreshAccess
  };
});
