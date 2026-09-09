<script setup lang="ts">
import { watch } from 'vue';
import { useEcharts } from '@/hooks/common/echarts';
import type { ECOption } from '@/hooks/common/echarts';
import type { DashboardData } from './use-dashboard';

const props = defineProps<{ data: DashboardData['trend'] }>();
const { domRef, updateOptions } = useEcharts(
  (): ECOption => ({
    textStyle: { fontSize: 14 },
    tooltip: { trigger: 'axis', textStyle: { fontSize: 14 } },
    legend: { data: ['成功', '失败'], textStyle: { fontSize: 14 } },
    grid: { left: 48, right: 24, top: 45, bottom: 36 },
    xAxis: { type: 'category', data: props.data.map(item => item.date.slice(5)), axisLabel: { fontSize: 14 } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 14 } },
    series: [
      {
        name: '成功',
        type: 'line',
        smooth: true,
        data: props.data.map(item => item.success),
        itemStyle: { color: '#18a058' }
      },
      {
        name: '失败',
        type: 'line',
        smooth: true,
        data: props.data.map(item => item.failure),
        itemStyle: { color: '#d03050' }
      }
    ]
  }),
  {
    onRender: chart => {
      chart.hideLoading();
    }
  }
);
watch(
  () => props.data,
  () => updateOptions((_, factory) => factory())
);
</script>

<template><div ref="domRef" class="h-320px" role="img" aria-label="最近七天操作成功与失败趋势" /></template>
