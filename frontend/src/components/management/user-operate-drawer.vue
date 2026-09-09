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
  canAssign: boolean;
  roles: Option[];
}>();
const emit = defineEmits<{ close: []; save: [value: Record<string, unknown>] }>();
const { formRef, validate, restoreValidation } = useNaiveForm();
const createModel = () => ({ name: '', email: '', password: '', enabled: 1, roleIds: [] as number[] });
const model = ref(createModel());
const title = computed(() => (props.operateType === 'add' ? '新增用户' : '编辑用户'));
const rules = computed(() => ({
  name: { required: true, message: '请输入用户名', trigger: 'blur' },
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email' as const, message: '请输入有效邮箱', trigger: 'blur' }
  ],
  password: {
    validator: () => (!model.value.password && props.operateType === 'edit') || model.value.password.length >= 12,
    message: '密码至少 12 位',
    trigger: 'blur'
  }
}));
watch(
  () => props.visible,
  visible => {
    if (!visible) return;
    model.value = Object.assign(
      createModel(),
      props.operateType === 'edit' && props.rowData ? jsonClone(props.rowData) : {}
    );
    model.value.enabled = Number(Boolean(model.value.enabled));
    model.value.password = '';
    restoreValidation();
  }
);
async function submit() {
  await validate();
  const { name, email, password, enabled, roleIds } = model.value;
  emit('save', {
    name,
    email,
    enabled: Boolean(enabled),
    ...(password ? { password } : {}),
    ...(props.canAssign ? { roleIds } : {})
  });
}
</script>

<template>
  <NDrawer
    :show="visible"
    display-directive="show"
    :width="360"
    :mask-closable="!saving"
    @update:show="!saving && emit('close')"
  >
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules">
        <NFormItem label="用户名" path="name">
          <NInput v-model:value="model.name" placeholder="请输入用户名" />
        </NFormItem>
        <NFormItem label="邮箱" path="email"><NInput v-model:value="model.email" placeholder="请输入邮箱" /></NFormItem>
        <NFormItem :label="operateType === 'add' ? '初始密码' : '重置密码'" path="password">
          <NInput
            v-model:value="model.password"
            type="password"
            show-password-on="click"
            :placeholder="operateType === 'add' ? '请输入至少 12 位密码' : '留空则不修改密码'"
            :input-props="{ autocomplete: 'new-password' }"
          />
        </NFormItem>
        <NFormItem label="用户状态" path="enabled">
          <NRadioGroup v-model:value="model.enabled">
            <NRadio :value="1" label="启用" />
            <NRadio :value="0" label="禁用" />
          </NRadioGroup>
        </NFormItem>
        <NFormItem v-if="canAssign" label="用户角色">
          <NSelect v-model:value="model.roleIds" multiple :options="roles" placeholder="请选择用户角色" filterable />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton :disabled="saving" @click="emit('close')">取消</NButton>
          <NButton type="primary" :loading="saving" @click="submit">确定</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
