<script setup lang="ts">
import { reactive } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { useNaiveForm } from '@/hooks/common/form';

const authStore = useAuthStore();
const { formRef, validate } = useNaiveForm();
const model = reactive({ email: '', password: '' });
const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email' as const, message: '请输入有效邮箱', trigger: 'blur' }
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};
async function submit() {
  await validate();
  await authStore.login(model.email, model.password);
}
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" @submit.prevent="submit">
    <NFormItem label="邮箱" path="email">
      <NInput v-model:value="model.email" placeholder="请输入邮箱" :input-props="{ autocomplete: 'username' }" />
    </NFormItem>
    <NFormItem label="密码" path="password">
      <NInput
        v-model:value="model.password"
        type="password"
        show-password-on="click"
        placeholder="请输入密码"
        :input-props="{ autocomplete: 'current-password' }"
      />
    </NFormItem>
    <NButton attr-type="submit" type="primary" block :loading="authStore.loginLoading">登录</NButton>
  </NForm>
</template>
