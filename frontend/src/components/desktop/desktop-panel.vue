<script setup lang="ts">
import { ref, watch } from 'vue';
import { desktopApiOrigin, desktopPanelVisible, normalizeApiOrigin, saveDesktopOrigin } from '@/desktop/connection';
import { useAuthStore } from '@/store/modules/auth';
import DesktopUpdate from './desktop-update.vue';

const auth = useAuthStore();
const address = ref(desktopApiOrigin.value);
const failed = ref('');
const saving = ref(false);
const updateBusy = ref(false);
watch(desktopPanelVisible, visible => {
  if (visible) {
    address.value = desktopApiOrigin.value;
    failed.value = '';
  }
});
async function connect() {
  try {
    const origin = normalizeApiOrigin(address.value, import.meta.env.VITE_DESKTOP_ALLOW_LOCAL_HTTP === 'Y');
    saving.value = true;
    if (origin !== desktopApiOrigin.value) await auth.resetStore();
    saveDesktopOrigin(origin);
    failed.value = '';
    desktopPanelVisible.value = false;
  } catch (error) {
    failed.value = error instanceof Error ? error.message : '连接设置未保存';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="desktopPanelVisible"
    preset="card"
    title="桌面设置"
    class="w-560px max-w-[calc(100vw-32px)]"
    :mask-closable="false"
    :closable="!updateBusy"
    :close-on-esc="!updateBusy"
  >
    <NTabs type="line" animated>
      <NTabPane name="connection" tab="服务连接" :disabled="updateBusy">
        <NForm @submit.prevent="connect">
          <NFormItem label="服务地址">
            <NInput v-model:value="address" placeholder="https://admin.example.com" />
          </NFormItem>
          <p class="mb-16px text-14px text-base-text/65">登录和业务数据请求将发送至此地址。更换服务会退出当前账户。</p>
          <NAlert v-if="failed" type="error" class="mb-16px">{{ failed }}</NAlert>
          <NButton type="primary" attr-type="submit" :loading="saving">保存连接</NButton>
        </NForm>
      </NTabPane>
      <NTabPane name="update" tab="版本与更新"><DesktopUpdate @busy="updateBusy = $event" /></NTabPane>
    </NTabs>
  </NModal>
</template>
