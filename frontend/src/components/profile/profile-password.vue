<script setup lang="ts">
import { reactive, shallowRef } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { request } from '@/service/request';
import { useNaiveForm } from '@/hooks/common/form';
const auth = useAuthStore();
const { formRef, validate } = useNaiveForm();
const saving = shallowRef(false);
const model = reactive({ currentPassword: '', password: '', password_confirmation: '' });
const rules = {
  currentPassword: { required: true, message: '请输入当前密码', trigger: 'blur' },
  password: { validator: () => model.password.length >= 12, message: '新密码至少 12 位', trigger: 'blur' },
  password_confirmation: {
    validator: () => Boolean(model.password_confirmation) && model.password_confirmation === model.password,
    message: '两次输入的密码不一致',
    trigger: 'blur'
  }
};
async function save() {
  await validate();
  saving.value = true;
  try {
    const { error } = await request({
      url: '/auth/profile',
      method: 'put',
      data: { name: auth.userInfo.userName, ...model }
    });
    if (!error) {
      Object.assign(model, { currentPassword: '', password: '', password_confirmation: '' });
      await auth.resetStore();
      window.$message?.success('密码已修改，请重新登录');
    }
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="px-8px py-20px sm:px-24px">
    <div class="mb-24px flex items-start gap-12px">
      <div class="flex-center rd-8px bg-primary/10 p-12px text-primary"><icon-ic-round-lock class="text-24px" /></div>
      <div>
        <h3 class="text-16px font-medium">修改登录密码</h3>
        <p class="mt-8px text-14px text-#999">修改密码后，所有已登录会话将退出</p>
      </div>
    </div>
    <NForm ref="formRef" :model="model" :rules="rules" label-placement="top" class="max-w-560px" @submit.prevent="save">
      <NFormItem label="当前密码" path="currentPassword">
        <NInput
          v-model:value="model.currentPassword"
          type="password"
          show-password-on="click"
          placeholder="请输入当前密码"
          :input-props="{ autocomplete: 'current-password' }"
        />
      </NFormItem>
      <NFormItem label="新密码" path="password">
        <NInput
          v-model:value="model.password"
          type="password"
          show-password-on="click"
          placeholder="请输入至少 12 位新密码"
          :input-props="{ autocomplete: 'new-password' }"
        />
      </NFormItem>
      <NFormItem label="确认新密码" path="password_confirmation">
        <NInput
          v-model:value="model.password_confirmation"
          type="password"
          show-password-on="click"
          placeholder="请再次输入新密码"
          :input-props="{ autocomplete: 'new-password' }"
        />
      </NFormItem>
      <NFormItem :show-label="false">
        <NButton type="primary" attr-type="submit" :loading="saving">更新密码</NButton>
      </NFormItem>
    </NForm>
  </div>
</template>
