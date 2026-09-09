<script setup lang="ts">
import { useAuthStore } from '@/store/modules/auth';
const auth = useAuthStore();
</script>

<template>
  <NCard title="首页" :bordered="false">
    <h2 class="text-20px">欢迎，{{ auth.userInfo.userName }}</h2>
    <p class="mt-12px">从左侧菜单进入已授权的管理页面，或在个人中心维护资料。</p>
  </NCard>
</template>
