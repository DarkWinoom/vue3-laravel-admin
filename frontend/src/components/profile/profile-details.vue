<script setup lang="ts">
import { reactive, shallowRef } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { request } from '@/service/request';
import { useNaiveForm } from '@/hooks/common/form';
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
  <div class="px-8px py-20px sm:px-24px">
    <div class="mb-24px">
      <h3 class="text-16px font-medium">基本资料</h3>
      <p class="mt-8px text-14px text-#999">维护你的账户信息和显示名称</p>
    </div>
    <NForm ref="formRef" :model="model" :rules="rules" label-placement="top" class="max-w-560px" @submit.prevent="save">
      <NFormItem label="用户名" path="name">
        <NInput v-model:value="model.name" placeholder="请输入用户名" maxlength="100" show-count />
      </NFormItem>
      <NFormItem label="邮箱">
        <NInput :value="auth.userInfo.email" disabled />
        <template #feedback>邮箱由管理员在用户管理中维护</template>
      </NFormItem>
      <NFormItem :show-label="false">
        <NSpace :size="16">
          <NButton type="primary" attr-type="submit" :loading="saving">保存修改</NButton>
          <NButton :disabled="saving" @click="model.name = auth.userInfo.userName">重置</NButton>
        </NSpace>
      </NFormItem>
    </NForm>
  </div>
</template>
