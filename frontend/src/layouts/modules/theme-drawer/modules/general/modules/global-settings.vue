<script setup lang="ts">
import { useThemeStore } from '@/store/modules/theme';
import { $t } from '@/locales';
import SettingItem from '../../../components/setting-item.vue';

defineOptions({
  name: 'GlobalSettings'
});

const themeStore = useThemeStore();
</script>

<template>
  <NDivider>{{ $t('theme.general.title') }}</NDivider>

  <SettingItem :label="$t('theme.general.globalSearch.visible')">
    <NSwitch v-model:value="themeStore.header.globalSearch.visible" />
  </SettingItem>
</template>

<style lang="scss" scoped>
.setting-list {
  &-move,
  &-enter-active,
  &-leave-active {
    --uno: transition-all-300;
  }

  &-enter-from,
  &-leave-to {
    --uno: opacity-0 -translate-x-30px;
  }

  &-leave-active {
    --uno: absolute;
  }
}
</style>
