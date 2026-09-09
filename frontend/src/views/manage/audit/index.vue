<script setup lang="ts">
import { useAppStore } from '@/store/modules/app';
import { useAudit } from './use-audit';

const app = useAppStore();
const {
  filters,
  failed,
  selected,
  reset,
  columns,
  columnChecks,
  data,
  loading,
  mobilePagination,
  getData,
  getDataByPage
} = useAudit();
const results = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failure' }
];
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <NCollapse>
        <NCollapseItem title="搜索" name="audit-search">
          <NForm label-placement="left" :label-width="90" @submit.prevent="getDataByPage(1)">
            <NGrid responsive="screen" item-responsive :x-gap="24">
              <NFormItemGi span="24 s:12 m:8" label="操作人">
                <NInput v-model:value="filters.actor" placeholder="请输入操作人" clearable />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:8" label="操作标识">
                <NInput v-model:value="filters.action" placeholder="如 user.created" clearable />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:8" label="操作结果">
                <NSelect v-model:value="filters.result" :options="results" placeholder="全部结果" clearable />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:8" label="开始日期">
                <NDatePicker
                  v-model:formatted-value="filters.dateFrom"
                  value-format="yyyy-MM-dd"
                  type="date"
                  clearable
                  class="w-full"
                />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:8" label="结束日期">
                <NDatePicker
                  v-model:formatted-value="filters.dateTo"
                  value-format="yyyy-MM-dd"
                  type="date"
                  clearable
                  class="w-full"
                />
              </NFormItemGi>
              <NFormItemGi span="24 s:12 m:8" label="请求编号">
                <NInput v-model:value="filters.requestId" placeholder="请输入完整请求编号" clearable />
              </NFormItemGi>
              <NFormItemGi span="24">
                <NSpace justify="end" class="w-full">
                  <NButton @click="reset">
                    <template #icon><icon-ic-round-refresh /></template>
                    重置
                  </NButton>
                  <NButton type="primary" ghost attr-type="submit">
                    <template #icon><icon-ic-round-search /></template>
                    搜索
                  </NButton>
                </NSpace>
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NCollapseItem>
      </NCollapse>
    </NCard>
    <NCard title="操作审计" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :loading="loading"
          :show-actions="false"
          @refresh="getData"
        />
      </template>
      <NAlert v-if="failed" type="error" class="mb-12px">加载失败，请点击刷新重试。</NAlert>
      <NDataTable
        :columns="columns"
        :data="data"
        size="small"
        :loading="loading"
        :flex-height="!app.isMobile"
        :scroll-x="925"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
    </NCard>
    <NDrawer :show="Boolean(selected)" :width="560" class="max-w-full" @update:show="!$event && (selected = null)">
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
  </div>
</template>

<style scoped lang="scss">
.audit-details {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 14px;
}
</style>
