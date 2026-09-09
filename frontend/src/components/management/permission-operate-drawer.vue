<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useNaiveForm } from '@/hooks/common/form';
import type { RecordItem } from './types';
const props = defineProps<{
  visible: boolean;
  operateType: NaiveUI.TableOperateType;
  rowData: RecordItem | null;
  saving: boolean;
}>();
const emit = defineEmits<{ close: []; save: [value: Record<string, unknown>] }>();
const { formRef, validate, restoreValidation } = useNaiveForm();
const model = ref({ name: '' });
const title = computed(() => (props.operateType === 'add' ? '新增权限' : '编辑权限'));
const rules = { name: { required: true, message: '请输入权限标识', trigger: 'blur' } };
watch(
  () => props.visible,
  visible => {
    if (visible) {
      model.value = { name: props.operateType === 'edit' ? props.rowData?.name || '' : '' };
      restoreValidation();
    }
  }
);
async function submit() {
  await validate();
  emit('save', { name: model.value.name });
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
        <NFormItem label="权限标识" path="name">
          <NInput v-model:value="model.name" placeholder="如 reports.read" />
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
