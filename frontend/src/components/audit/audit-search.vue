<script setup lang="ts">
import type { AuditFilters } from './use-audit';
const model = defineModel<AuditFilters>('model', { required: true });
const emit = defineEmits<{ search: []; reset: [] }>();
const results = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failure' }
];
</script>

<template>
  <NCard :bordered="false" size="small" class="card-wrapper">
    <NCollapse>
      <NCollapseItem title="搜索" name="audit-search">
        <NForm label-placement="left" :label-width="90" @submit.prevent="emit('search')">
          <NGrid responsive="self" item-responsive :x-gap="8">
            <NFormItemGi span="24 600:12 960:8" label="操作人">
              <NInput v-model:value="model.actor" placeholder="请输入操作人" clearable />
            </NFormItemGi>
            <NFormItemGi span="24 600:12 960:8" label="操作标识">
              <NInput v-model:value="model.action" placeholder="如 user.created" clearable />
            </NFormItemGi>
            <NFormItemGi span="24 600:12 960:8" label="操作结果">
              <NSelect v-model:value="model.result" :options="results" placeholder="全部结果" clearable />
            </NFormItemGi>
            <NFormItemGi span="24 600:12 960:8" label="开始日期">
              <NDatePicker
                v-model:formatted-value="model.dateFrom"
                value-format="yyyy-MM-dd"
                type="date"
                clearable
                class="w-full"
              />
            </NFormItemGi>
            <NFormItemGi span="24 600:12 960:8" label="结束日期">
              <NDatePicker
                v-model:formatted-value="model.dateTo"
                value-format="yyyy-MM-dd"
                type="date"
                clearable
                class="w-full"
              />
            </NFormItemGi>
            <NFormItemGi span="24 600:12 960:8" label="请求编号">
              <NInput v-model:value="model.requestId" placeholder="请输入完整请求编号" clearable />
            </NFormItemGi>
            <NFormItemGi span="24">
              <NSpace justify="end" class="w-full">
                <NButton @click="emit('reset')">
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
</template>
