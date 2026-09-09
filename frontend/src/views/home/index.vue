<script setup lang="ts">
import { useAuthStore } from '@/store/modules/auth';
import { useDashboard } from './use-dashboard';
import AuditTrend from './modules/audit-trend.vue';
const auth = useAuthStore();
const { data, loading, failed, refresh } = useDashboard();
const cards = {
  users: {
    title: '用户总数',
    icon: 'ic:round-manage-accounts',
    color: 'linear-gradient(to bottom right, #ec4786, #b955a4)'
  },
  roles: { title: '角色总数', icon: 'carbon:user-role', color: 'linear-gradient(to bottom right, #865ec0, #5144b4)' },
  permissions: {
    title: '权限总数',
    icon: 'ic:round-security',
    color: 'linear-gradient(to bottom right, #56cdf3, #719de3)'
  },
  menus: {
    title: '菜单总数',
    icon: 'material-symbols:route',
    color: 'linear-gradient(to bottom right, #fcbc25, #f68057)'
  }
};
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
      <NCard :bordered="false" size="small" class="card-wrapper">
        <NGrid v-if="data.metrics.length" cols="1 s:2 l:4" responsive="screen" :x-gap="16" :y-gap="16">
          <NGi v-for="metric in data.metrics" :key="metric.key">
            <div class="dashboard-metric" :style="{ backgroundImage: cards[metric.key].color }">
              <h3 class="text-16px">{{ cards[metric.key].title }}</h3>
              <div class="flex items-center justify-between pt-12px">
                <SvgIcon :icon="cards[metric.key].icon" class="text-32px" />
                <span class="text-30px">{{ metric.value.toLocaleString() }}</span>
              </div>
            </div>
          </NGi>
        </NGrid>
        <NEmpty v-else description="当前账户暂无可查看的管理统计" class="py-24px" />
      </NCard>
      <template v-if="data.canAudit">
        <NCard title="操作趋势" :bordered="false" class="card-wrapper">
          <template #header-extra><span class="text-14px text-base-text/65">最近 7 天 · UTC</span></template>
          <AuditTrend :data="data.trend" />
        </NCard>
        <NCard title="最近操作" :bordered="false" class="card-wrapper">
          <NList v-if="data.recent.length" hoverable>
            <NListItem v-for="item in data.recent" :key="item.id">
              <div class="flex flex-wrap items-center justify-between gap-12px">
                <div>
                  <span>{{ item.actor_name || '系统 / 未登录' }}</span>
                  <span class="ml-12px break-all text-base-text/65">{{ item.action }}</span>
                </div>
                <NSpace align="center">
                  <span class="text-14px text-base-text/65">{{ item.occurred_at }} UTC</span>
                  <NTag :type="item.result === 'success' ? 'success' : 'error'" :bordered="false">
                    {{ item.result === 'success' ? '成功' : '失败' }}
                  </NTag>
                </NSpace>
              </div>
            </NListItem>
          </NList>
          <NEmpty v-else description="暂无操作记录" class="py-24px" />
        </NCard>
      </template>
      <p class="pb-8px text-right text-14px text-base-text/65">
        更新于 {{ new Date(data.generatedAt).toLocaleString('zh-CN') }}
      </p>
    </template>
  </div>
</template>

<style scoped lang="scss">
.dashboard-metric {
  border-radius: 8px;
  padding: 12px 16px;
  color: white;
}
</style>
