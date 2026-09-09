<script setup lang="ts">
import { reactive, shallowRef } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { request } from '@/service/request';
import { useNaiveForm } from '@/hooks/common/form';
import ProfileSection from './profile-section.vue';
const auth = useAuthStore();
const { formRef, validate } = useNaiveForm();
const saving = shallowRef(false);
const model = reactive({ name: auth.userInfo.userName });
const rules = { name: { required: true, message: '请输入用户名', trigger: 'blur' } };
async function save() {
  await validate();
  saving.value = true;
  try {
    const { error } = await request({ url: '/auth/profile', method: 'put', data: { name: model.name } });
    if (!error) {
      await auth.refreshAccess();
      window.$message?.success('个人资料已保存');
    }
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" label-placement="top" class="profile-form" @submit.prevent="save">
    <ProfileSection title="基本资料" subtitle="维护账户信息与显示名称">
      <template #icon><icon-ic-round-person-outline /></template>
      <NFormItem label="用户名" path="name">
        <NInput v-model:value="model.name" placeholder="请输入用户名" maxlength="100" show-count />
      </NFormItem>
      <NFormItem label="邮箱">
        <NInput :value="auth.userInfo.email" disabled />
        <template #feedback>邮箱由管理员在用户管理中维护</template>
      </NFormItem>
      <template #actions>
        <NButton :disabled="saving" @click="model.name = auth.userInfo.userName">重置</NButton>
        <NButton type="primary" attr-type="submit" :loading="saving">保存修改</NButton>
      </template>
    </ProfileSection>
  </NForm>
</template>
