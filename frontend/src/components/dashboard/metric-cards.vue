<script setup lang="ts">
import type { DashboardData } from './use-dashboard';
defineProps<{ metrics: DashboardData['metrics'] }>();
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
  <NCard :bordered="false" size="small" class="card-wrapper">
    <NGrid v-if="metrics.length" cols="1 s:2 l:4" responsive="screen" :x-gap="16" :y-gap="16">
      <NGi v-for="metric in metrics" :key="metric.key">
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
</template>

<style scoped lang="scss">
.dashboard-metric {
  border-radius: 8px;
  padding: 12px 16px;
  color: white;
}
</style>
