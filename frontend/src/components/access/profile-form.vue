<script setup lang="ts">
import { reactive, shallowRef } from 'vue';
import { request } from '@/service/request';
import { useAuthStore } from '@/store/modules/auth';
import { useNaiveForm } from '@/hooks/common/form';

const auth = useAuthStore();
const { formRef, validate } = useNaiveForm();
const saving = shallowRef(false);
const model = reactive({ name: auth.userInfo.userName, currentPassword: '', password: '', password_confirmation: '' });
const rules = {
  name: { required: true, message: '请输入姓名', trigger: 'blur' },
  password: {
    validator: () => !model.password || model.password.length >= 12,
    message: '新密码至少 12 位',
    trigger: 'blur'
  },
  password_confirmation: {
    validator: () => model.password === model.password_confirmation,
    message: '两次密码不一致',
    trigger: 'blur'
  }
};
async function save() {
  await validate();
  saving.value = true;
  const changingPassword = Boolean(model.password);
  const { error } = await request<Api.Auth.UserInfo>({
    url: '/auth/profile',
    method: 'put',
    data: {
      name: model.name,
      ...(changingPassword
        ? {
            currentPassword: model.currentPassword,
            password: model.password,
            password_confirmation: model.password_confirmation
          }
        : {})
    }
  });
  saving.value = false;
  if (error) return;
  window.$message?.success(changingPassword ? '密码已修改，请重新登录' : '资料已保存');
  model.currentPassword = '';
  model.password = '';
  model.password_confirmation = '';
  if (changingPassword) await auth.resetStore();
  else await auth.refreshAccess();
}
</script>

<template>
  <NCard title="个人中心" :bordered="false">
    <NForm ref="formRef" :model="model" :rules="rules" class="max-w-520px">
      <NFormItem label="邮箱"><NInput :value="auth.userInfo.email" disabled /></NFormItem>
      <NFormItem label="姓名" path="name"><NInput v-model:value="model.name" /></NFormItem>
      <NDivider>修改密码</NDivider>
      <NFormItem label="当前密码">
        <NInput
          v-model:value="model.currentPassword"
          type="password"
          :input-props="{ autocomplete: 'current-password' }"
        />
      </NFormItem>
      <NFormItem label="新密码（留空不修改）" path="password">
        <NInput v-model:value="model.password" type="password" :input-props="{ autocomplete: 'new-password' }" />
      </NFormItem>
      <NFormItem label="确认新密码" path="password_confirmation">
        <NInput
          v-model:value="model.password_confirmation"
          type="password"
          :input-props="{ autocomplete: 'new-password' }"
        />
      </NFormItem>
      <NButton type="primary" :loading="saving" @click="save">保存</NButton>
    </NForm>
  </NCard>
</template>
