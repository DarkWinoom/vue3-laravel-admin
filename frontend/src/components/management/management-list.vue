<script setup lang="ts">
import { useAppStore } from '@/store/modules/app';
import ManagementSearch from './management-search.vue';
import UserOperateDrawer from './user-operate-drawer.vue';
import RoleOperateDrawer from './role-operate-drawer.vue';
import PermissionOperateDrawer from './permission-operate-drawer.vue';
import MenuOperateModal from './menu-operate-modal.vue';
import { useManagement } from './use-management';
import { titles } from './types';
import type { Resource } from './types';

const props = defineProps<{ resource: Resource }>();
const appStore = useAppStore();
const {
  columns,
  columnChecks,
  data,
  loading,
  mobilePagination,
  getData,
  getDataByPage,
  filters,
  failed,
  saving,
  drawerVisible,
  operateType,
  editingData,
  closeDrawer,
  can,
  canAssign,
  roleOptions,
  permissionOptions,
  menuOptions,
  open,
  save,
  reset
} = useManagement(props.resource);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <ManagementSearch v-model:model="filters" :resource="resource" @search="getDataByPage(1)" @reset="reset" />
    <NCard :title="titles[resource]" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation v-model:columns="columnChecks" :loading="loading" @refresh="getData">
          <NButton v-if="can('create')" size="small" ghost type="primary" @click="open()">
            <template #icon><icon-ic-round-plus class="text-icon" /></template>
            新增
          </NButton>
        </TableHeaderOperation>
      </template>
      <NAlert v-if="failed" type="error" class="mb-12px">加载失败，请点击刷新重试。</NAlert>
      <NDataTable
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="resource === 'menus' ? 1200 : 962"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <UserOperateDrawer
        v-if="resource === 'users'"
        :visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        :saving="saving"
        :can-assign="canAssign"
        :roles="roleOptions"
        @close="closeDrawer"
        @save="save"
      />
      <RoleOperateDrawer
        v-else-if="resource === 'roles'"
        :visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        :saving="saving"
        :permissions="permissionOptions"
        @close="closeDrawer"
        @save="save"
      />
      <PermissionOperateDrawer
        v-else-if="resource === 'permissions'"
        :visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        :saving="saving"
        @close="closeDrawer"
        @save="save"
      />
      <MenuOperateModal
        v-else
        :visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        :saving="saving"
        :permissions="permissionOptions"
        :parents="menuOptions"
        @close="closeDrawer"
        @save="save"
      />
    </NCard>
  </div>
</template>
