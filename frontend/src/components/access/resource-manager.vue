<script setup lang="ts">
import ResourceEditor from './resource-editor.vue';
import ResourceTable from './resource-table.vue';
import { titles } from './types';
import type { Resource } from './types';
import { useResource } from './use-resource';

const props = defineProps<{ resource: Resource }>();
const {
  rows,
  total,
  page,
  pageSize,
  search,
  loading,
  failed,
  saving,
  editing,
  drawer,
  roleOptions,
  permissionOptions,
  menuOptions,
  can,
  canAssign,
  load,
  open,
  save,
  remove,
  searchNow,
  changePage,
  changePageSize
} = useResource(props.resource);
</script>

<template>
  <div class="flex-col-stretch gap-16px">
    <NCard :title="titles[resource]" :bordered="false">
      <NSpace class="mb-16px" align="center" wrap>
        <NInput v-model:value="search" placeholder="搜索名称" clearable @keyup.enter="searchNow" />
        <NButton :loading="loading" @click="searchNow">查询</NButton>
        <NButton @click="load">刷新</NButton>
        <NButton v-if="can('create')" type="primary" @click="open()">新增</NButton>
      </NSpace>
      <NAlert v-if="failed" type="error" class="mb-16px">加载失败，请点击刷新重试。</NAlert>
      <ResourceTable
        :resource="resource"
        :rows="rows"
        :loading="loading"
        :edit="can('update')"
        :remove="can('delete')"
        @edit="open"
        @remove="remove"
      />
      <div class="mt-16px flex justify-end overflow-auto">
        <NPagination
          :page="page"
          :page-size="pageSize"
          :item-count="total"
          :page-sizes="[10, 20, 50, 100]"
          show-size-picker
          @update:page="changePage"
          @update:page-size="changePageSize"
        />
      </div>
    </NCard>
    <ResourceEditor
      :open="drawer"
      :resource="resource"
      :item="editing"
      :saving="saving"
      :can-assign="canAssign"
      :roles="roleOptions"
      :permissions="permissionOptions"
      :parents="menuOptions"
      @close="drawer = false"
      @save="save"
    />
  </div>
</template>
