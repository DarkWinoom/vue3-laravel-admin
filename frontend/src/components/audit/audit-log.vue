<script setup lang="ts">
import { useAppStore } from '@/store/modules/app';
import { useAudit } from './use-audit';
import AuditSearch from './audit-search.vue';
import AuditDetail from './audit-detail.vue';

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
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <AuditSearch v-model:model="filters" @search="getDataByPage(1)" @reset="reset" />
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
    <AuditDetail :selected="selected" @close="selected = null" />
  </div>
</template>
