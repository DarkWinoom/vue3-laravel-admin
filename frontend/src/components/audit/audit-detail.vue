<script setup lang="ts">
import type { AuditRow } from './use-audit';
defineProps<{ selected: AuditRow | null }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <NDrawer :show="Boolean(selected)" :width="560" class="max-w-full" @update:show="!$event && emit('close')">
    <NDrawerContent title="审计详情" closable>
      <NDescriptions v-if="selected" :column="1" bordered label-placement="top">
        <NDescriptionsItem label="请求编号">
          <span class="break-all">{{ selected.request_id }}</span>
        </NDescriptionsItem>
        <NDescriptionsItem label="操作人">
          {{ selected.actor_name || '系统 / 未登录' }}（{{ selected.actor_id ?? '—' }}）
        </NDescriptionsItem>
        <NDescriptionsItem label="操作 / 对象">
          {{ selected.action }} / {{ selected.target_id || '—' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="响应状态">
          {{ selected.status_code }} {{ selected.error_code || '' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="时间（UTC）">{{ selected.occurred_at }}</NDescriptionsItem>
        <NDescriptionsItem label="记录内容">
          <pre class="audit-details">{{ JSON.stringify(selected.details, null, 2) }}</pre>
        </NDescriptionsItem>
      </NDescriptions>
      <p class="mt-16px text-14px text-base-text/65">
        仅保留必要业务字段。密码、邮箱、令牌、Cookie 和请求正文不进入审计记录。
      </p>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped lang="scss">
.audit-details {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 14px;
}
</style>
