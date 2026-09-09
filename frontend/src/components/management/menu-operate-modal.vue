<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { useNaiveForm } from '@/hooks/common/form';
import type { Option, RecordItem } from './types';
const props = defineProps<{
  visible: boolean;
  operateType: NaiveUI.TableOperateType;
  rowData: RecordItem | null;
  saving: boolean;
  parents: Option[];
  permissions: Option[];
}>();
const emit = defineEmits<{ close: []; save: [value: Record<string, unknown>] }>();
const { formRef, validate, restoreValidation } = useNaiveForm();
const createModel = () => ({
  name: '',
  title: '',
  path: '',
  component: 'users',
  parent_id: null as number | null,
  permission: null as string | null,
  icon: 'ic:round-manage-accounts',
  sort: 1,
  enabled: 1
});
const model = ref(createModel());
const title = computed(() => (props.operateType === 'add' ? '新增菜单' : '编辑菜单'));
const type = computed({
  get: () => (model.value.component === 'group' ? 'group' : 'page'),
  set: value => {
    model.value.component = value === 'group' ? 'group' : 'users';
    if (value === 'group') model.value.parent_id = null;
  }
});
const pages = [
  { label: '用户管理', value: 'users' },
  { label: '角色管理', value: 'roles' },
  { label: '权限管理', value: 'permissions' },
  { label: '菜单管理', value: 'menus' },
  { label: '操作审计', value: 'audit' },
  { label: 'API 文档', value: 'docs' }
];
const rules = {
  name: { required: true, message: '请输入路由名称', trigger: 'blur' },
  title: { required: true, message: '请输入菜单名称', trigger: 'blur' },
  path: { required: true, message: '请输入路由路径', trigger: 'blur' }
};
watch(
  () => props.visible,
  visible => {
    if (!visible) return;
    model.value = Object.assign(
      createModel(),
      props.operateType === 'edit' && props.rowData ? jsonClone(props.rowData) : {}
    );
    model.value.enabled = Number(Boolean(model.value.enabled));
    restoreValidation();
  }
);
async function submit() {
  await validate();
  emit('save', { ...model.value, enabled: Boolean(model.value.enabled) });
}
</script>

<template>
  <NModal
    :show="visible"
    :title="title"
    preset="card"
    class="w-800px max-w-[calc(100vw-32px)]"
    :mask-closable="!saving"
    @update:show="!saving && emit('close')"
  >
    <NScrollbar class="max-h-[65vh] pr-20px">
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
        <NGrid responsive="screen" item-responsive :x-gap="20">
          <NFormItemGi span="24 m:12" label="菜单类型">
            <NRadioGroup v-model:value="type">
              <NRadio value="group" label="目录" />
              <NRadio value="page" label="菜单" />
            </NRadioGroup>
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="菜单名称" path="title">
            <NInput v-model:value="model.title" placeholder="请输入菜单名称" />
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="路由名称" path="name">
            <NInput v-model:value="model.name" placeholder="如 manage_user" />
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="路由路径" path="path">
            <NInput v-model:value="model.path" placeholder="如 /manage/user" />
          </NFormItemGi>
          <NFormItemGi v-if="type === 'page'" span="24 m:12" label="上级目录">
            <NSelect v-model:value="model.parent_id" :options="parents" clearable placeholder="请选择上级目录" />
          </NFormItemGi>
          <NFormItemGi v-if="type === 'page'" span="24 m:12" label="页面组件">
            <NSelect v-model:value="model.component" :options="pages" placeholder="请选择页面" />
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="排序">
            <NInputNumber v-model:value="model.sort" :min="0" :max="10000" class="w-full" />
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="图标">
            <NInput v-model:value="model.icon" placeholder="请输入图标名称">
              <template #suffix><SvgIcon :icon="model.icon" class="text-icon" /></template>
            </NInput>
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="菜单状态">
            <NRadioGroup v-model:value="model.enabled">
              <NRadio :value="1" label="启用" />
              <NRadio :value="0" label="禁用" />
            </NRadioGroup>
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="访问权限">
            <NSelect
              v-model:value="model.permission"
              :options="permissions"
              clearable
              filterable
              placeholder="请选择权限"
            />
          </NFormItemGi>
        </NGrid>
      </NForm>
    </NScrollbar>
    <template #footer>
      <NSpace justify="end" :size="16">
        <NButton :disabled="saving" @click="emit('close')">取消</NButton>
        <NButton type="primary" :loading="saving" @click="submit">确定</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
