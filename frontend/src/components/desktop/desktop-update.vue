<script setup lang="ts">
import { watch } from 'vue';
import { useDesktopUpdate } from './use-desktop-update';
const { currentVersion, state, busy, release, progress, message, checkUpdate, installUpdate, restart } =
  useDesktopUpdate();
const emit = defineEmits<{ busy: [value: boolean] }>();
watch(busy, value => emit('busy', value), { immediate: true });
const enabled = import.meta.env.VITE_DESKTOP_UPDATER_ENABLED === 'Y';
</script>

<template>
  <div class="flex-col gap-16px">
    <p>当前版本：{{ currentVersion }}</p>
    <NAlert v-if="!enabled" type="info">此构建尚未配置签名更新，可通过安装新版应用升级。</NAlert>
    <template v-else>
      <NButton
        :loading="state === 'checking'"
        :disabled="state === 'downloading' || state === 'ready'"
        @click="checkUpdate"
      >
        检查更新
      </NButton>
      <NAlert v-if="message" :type="state === 'error' ? 'error' : 'info'">{{ message }}</NAlert>
      <template v-if="release">
        <h3 class="text-16px">新版本 {{ release.version }}</h3>
        <p class="whitespace-pre-wrap break-words">{{ release.body || '此版本未提供更新说明。' }}</p>
        <NProgress v-if="state === 'downloading'" type="line" :percentage="progress" :processing="true" />
        <NButton v-if="state === 'available' || state === 'error'" type="primary" @click="installUpdate">
          下载并安装
        </NButton>
        <NButton v-if="state === 'ready'" type="primary" @click="restart">重启完成更新</NButton>
      </template>
    </template>
  </div>
</template>
