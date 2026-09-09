<script setup lang="ts">
import type { DashboardData } from './use-dashboard';
defineProps<{ recent: DashboardData['recent'] }>();
</script>

<template>
  <NCard title="最近操作" :bordered="false" class="card-wrapper">
    <NList v-if="recent.length" hoverable>
      <NListItem v-for="item in recent" :key="item.id">
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
