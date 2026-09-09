<script setup lang="ts">
import type { Resource, SearchModel } from './types';
defineProps<{ resource: Resource }>();
const model = defineModel<SearchModel>('model', { required: true });
const emit = defineEmits<{ search: []; reset: [] }>();
const statuses = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 }
];
</script>

<template>
  <NCard :bordered="false" size="small" class="card-wrapper">
    <NCollapse>
      <NCollapseItem title="搜索" name="management-search">
        <NForm :model="model" label-placement="left" :label-width="80" @submit.prevent="emit('search')">
          <NGrid responsive="self" item-responsive>
            <template v-if="resource === 'users'">
              <NFormItemGi span="24 600:12 960:6" label="用户名" class="pr-24px">
                <NInput v-model:value="model.name" placeholder="请输入用户名" clearable />
              </NFormItemGi>
              <NFormItemGi span="24 600:12 960:6" label="邮箱" class="pr-24px">
                <NInput v-model:value="model.email" placeholder="请输入邮箱" clearable />
              </NFormItemGi>
              <NFormItemGi span="24 600:12 960:6" label="用户状态" class="pr-24px">
                <NSelect v-model:value="model.enabled" :options="statuses" placeholder="请选择用户状态" clearable />
              </NFormItemGi>
            </template>
            <NFormItemGi
              v-else
              span="24 600:12 960:12"
              :label="resource === 'roles' ? '角色名称' : resource === 'menus' ? '菜单名称' : '权限标识'"
              class="pr-24px"
            >
              <NInput v-model:value="model.search" placeholder="请输入查询关键字" clearable />
            </NFormItemGi>
            <NFormItemGi :span="resource === 'users' ? '24 600:12 960:6' : '24 600:12 960:12'" class="pr-24px">
              <NSpace class="w-full" justify="end">
                <NButton @click="emit('reset')">
                  <template #icon><icon-ic-round-refresh class="text-icon" /></template>
                  重置
                </NButton>
                <NButton type="primary" ghost attr-type="submit">
                  <template #icon><icon-ic-round-search class="text-icon" /></template>
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
