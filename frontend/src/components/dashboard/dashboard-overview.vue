<script setup lang="ts">
import { useAuthStore } from '@/store/modules/auth';
import { useDashboard } from './use-dashboard';
import AuditTrend from './audit-trend.vue';
import MetricCards from './metric-cards.vue';
import RecentActivity from './recent-activity.vue';
const auth = useAuthStore();
const { data, loading, failed, refresh } = useDashboard();
</script>

<template>
  <div class="flex-col-stretch gap-16px">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-16px">
        <div class="min-w-0 flex items-center gap-12px">
          <div class="size-48px flex-center shrink-0 rd-8px bg-primary/10 text-26px text-primary">
            <SvgIcon icon="mdi:monitor-dashboard" />
          </div>
          <div class="min-w-0">
            <h2 class="truncate text-16px leading-22px">欢迎，{{ auth.userInfo.userName }}</h2>
            <p class="mt-2px text-14px text-base-text/65 leading-20px">当前账户的授权数据概览</p>
          </div>
        </div>
        <NButton :loading="loading" @click="refresh">
          <template #icon><icon-ic-round-refresh /></template>
          刷新数据
        </NButton>
      </div>
    </NCard>
    <NAlert v-if="failed" type="error">数据加载失败，请点击刷新数据重试。</NAlert>
    <NSkeleton v-if="loading && !data" height="140px" :repeat="2" />
    <template v-if="data">
      <MetricCards :metrics="data.metrics" />
      <template v-if="data.canAudit">
        <NCard title="操作趋势" :bordered="false" class="card-wrapper">
          <template #header-extra><span class="text-14px text-base-text/65">最近 7 天 · UTC</span></template>
          <AuditTrend :data="data.trend" />
        </NCard>
        <RecentActivity :recent="data.recent" />
      </template>
      <p class="pb-8px text-right text-14px text-base-text/65">
        更新于 {{ new Date(data.generatedAt).toLocaleString('zh-CN') }}
      </p>
    </template>
  </div>
</template>
