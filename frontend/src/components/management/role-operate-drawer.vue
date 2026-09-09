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
  permissions: Option[];
}>();
const emit = defineEmits<{ close: []; save: [value: Record<string, unknown>] }>();
const { formRef, validate, restoreValidation } = useNaiveForm();
const model = ref({ name: '', permissionIds: [] as number[] });
const title = computed(() => (props.operateType === 'add' ? '新增角色' : '编辑角色'));
const rules = { name: { required: true, message: '请输入角色名称', trigger: 'blur' } };
watch(
  () => props.visible,
  visible => {
    if (!visible) return;
    model.value = { name: '', permissionIds: [] };
    if (props.operateType === 'edit' && props.rowData) Object.assign(model.value, jsonClone(props.rowData));
    restoreValidation();
  }
);
const tree = computed(() => {
  const labels: Record<string, string> = {
    users: '用户管理',
    roles: '角色管理',
    permissions: '权限管理',
    menus: '菜单管理',
    audit: '操作审计',
    docs: 'API 文档'
  };
  const verbs: Record<string, string> = { read: '查看', create: '新增', update: '编辑', delete: '删除' };
  const groups = new Map<string, { key: string; label: string; children: { key: number; label: string }[] }>();
  props.permissions.forEach(item => {
    const [area, verb] = item.label.split('.');
    if (!groups.has(area)) groups.set(area, { key: 'group:' + area, label: labels[area] || area, children: [] });
    groups
      .get(area)!
      .children.push({ key: Number(item.value), label: (verbs[verb] || verb || item.label) + ' · ' + item.label });
  });
  return Array.from(groups.values());
});
function check(keys: (string | number)[]) {
  model.value.permissionIds = keys.filter((key): key is number => typeof key === 'number');
}
async function submit() {
  await validate();
  emit('save', { name: model.value.name, permissionIds: model.value.permissionIds });
}
</script>

<template>
  <NDrawer
    class="max-w-full"
    :show="visible"
    display-directive="show"
    :width="360"
    :mask-closable="!saving"
    @update:show="!saving && emit('close')"
  >
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules">
        <NFormItem label="角色名称" path="name">
          <NInput v-model:value="model.name" placeholder="请输入角色标识，如 operator" />
        </NFormItem>
      </NForm>
      <NDivider title-placement="left">权限配置</NDivider>
      <NTree
        :data="tree"
        :checked-keys="model.permissionIds"
        checkable
        cascade
        check-strategy="child"
        default-expand-all
        block-line
        @update:checked-keys="check"
      />
      <template #footer>
        <NSpace :size="16">
          <NButton :disabled="saving" @click="emit('close')">取消</NButton>
          <NButton type="primary" :loading="saving" @click="submit">确定</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
