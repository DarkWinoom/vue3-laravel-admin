import type { App } from 'vue';
import { createI18n } from 'vue-i18n';
import zhCN from './langs/zh-cn';

const i18n = createI18n({ locale: 'zh-CN', fallbackLocale: 'zh-CN', messages: { 'zh-CN': zhCN }, legacy: false });

export function setupI18n(app: App) {
  document.documentElement.lang = 'zh-CN';
  app.use(i18n);
}

export const $t = i18n.global.t as App.I18n.$T;
