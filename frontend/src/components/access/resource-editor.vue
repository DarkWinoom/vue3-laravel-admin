<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { FormRules } from 'naive-ui';
import { useNaiveForm } from '@/hooks/common/form';
import type { Option, RecordItem, Resource } from './types';

const props = defineProps<{
  open: boolean;
  resource: Resource;
  item: RecordItem | null;
  saving: boolean;
  canAssign: boolean;
  roles: Option[];
  permissions: Option[];
  parents: Option[];
}>();
const emit = defineEmits<{ close: []; save: [data: Record<string, unknown>] }>();
const { formRef, validate } = useNaiveForm();
const model = reactive({
  name: '',
  email: '',
  password: '',
  enabled: true,
  roleIds: [] as number[],
  permissionIds: [] as number[],
  title: '',
  path: '',
  component: 'users',
  parent_id: null as number | null,
  permission: null as string | null,
  icon: 'mdi:menu',
  sort: 10
});
watch(
  () => props.open,
  open => {
    if (!open) return;
    Object.assign(
      model,
      {
        name: '',
        email: '',
        password: '',
        enabled: true,
        roleIds: [],
        permissionIds: [],
        title: '',
        path: '',
        component: 'users',
        parent_id: null,
        permission: null,
        icon: 'mdi:menu',
        sort: 10
      },
      props.item || {}
    );
    model.enabled = Boolean(model.enabled);
    model.password = '';
    formRef.value?.restoreValidation();
  }
);
const rules = computed<FormRules>(() => ({
  name: { required: true, message: '请输入名称', trigger: 'blur' },
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: {
    validator: () => (!model.password && Boolean(props.item)) || model.password.length >= 12,
    message: '密码至少 12 位',
    trigger: 'blur'
  },
  title: { required: true, message: '请输入标题', trigger: 'blur' },
  path: { required: true, message: '请输入路径', trigger: 'blur' }
}));
const views = [
  { label: '分组', value: 'group' },
  { label: '用户管理', value: 'users' },
  { label: '角色管理', value: 'roles' },
  { label: '权限管理', value: 'permissions' },
  { label: '菜单管理', value: 'menus' }
];
async function submit() {
  await validate();
  let data: Record<string, unknown> = { name: model.name };
  if (props.resource === 'users')
    data = {
      ...data,
      email: model.email,
      enabled: model.enabled,
      ...(model.password ? { password: model.password } : {}),
      ...(props.canAssign ? { roleIds: [...model.roleIds] } : {})
    };
  if (props.resource === 'roles') data.permissionIds = [...model.permissionIds];
  if (props.resource === 'menus')
    data = {
      ...data,
      title: model.title,
      path: model.path,
      component: model.component,
      parent_id: model.parent_id,
      permission: model.permission,
      icon: model.icon,
      sort: model.sort,
      enabled: model.enabled
    };
  emit('save', data);
}
</script>

<template>
  <NDrawer
    :show="open"
    :width="520"
    :mask-closable="!saving"
    :close-on-esc="!saving"
    @update:show="!saving && emit('close')"
  >
    <NDrawerContent :title="item ? '编辑记录' : '新增记录'" closable>
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="top">
        <NFormItem :label="resource === 'users' ? '姓名' : '名称 / 标识'" path="name">
          <NInput v-model:value="model.name" />
        </NFormItem>
        <template v-if="resource === 'users'">
          <NFormItem label="邮箱" path="email"><NInput v-model:value="model.email" /></NFormItem>
          <NFormItem :label="item ? '重置密码（留空不修改）' : '初始密码'" path="password">
            <NInput
              v-model:value="model.password"
              type="password"
              show-password-on="click"
              :input-props="{ autocomplete: 'new-password' }"
            />
          </NFormItem>
          <NFormItem v-if="canAssign" label="角色">
            <NSelect v-model:value="model.roleIds" :options="roles" multiple filterable />
          </NFormItem>
        </template>
        <NFormItem v-if="resource === 'roles'" label="权限">
          <NSelect v-model:value="model.permissionIds" :options="permissions" multiple filterable />
        </NFormItem>
        <template v-if="resource === 'menus'">
          <NFormItem label="标题" path="title"><NInput v-model:value="model.title" /></NFormItem>
          <NFormItem label="路径" path="path"><NInput v-model:value="model.path" placeholder="/users" /></NFormItem>
          <NFormItem label="页面"><NSelect v-model:value="model.component" :options="views" /></NFormItem>
          <NFormItem label="上级分组">
            <NSelect v-model:value="model.parent_id" :options="parents" clearable />
          </NFormItem>
          <NFormItem label="访问权限">
            <NSelect v-model:value="model.permission" :options="permissions" filterable clearable />
          </NFormItem>
          <NFormItem label="图标"><NInput v-model:value="model.icon" /></NFormItem>
          <NFormItem label="排序"><NInputNumber v-model:value="model.sort" :min="0" :max="10000" /></NFormItem>
        </template>
        <NFormItem v-if="resource === 'users' || resource === 'menus'" label="启用">
          <NSwitch v-model:value="model.enabled" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace>
          <NButton :disabled="saving" @click="emit('close')">取消</NButton>
          <NButton type="primary" :loading="saving" @click="submit">保存</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
