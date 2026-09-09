<script setup lang="ts">
import { useAuthStore } from '@/store/modules/auth';
import ProfileDetails from './profile-details.vue';
import ProfilePassword from './profile-password.vue';
const auth = useAuthStore();
</script>

<template>
  <NGrid responsive="screen" item-responsive :x-gap="16" :y-gap="16" class="min-h-500px">
    <NGi span="24 m:7 l:6">
      <NCard title="个人信息" :bordered="false" size="small" class="card-wrapper">
        <div class="flex-col-center gap-12px py-20px">
          <NAvatar round :size="88" class="bg-primary/10 text-32px text-primary">
            {{ auth.userInfo.userName.slice(0, 1).toUpperCase() }}
          </NAvatar>
          <h2 class="text-18px font-medium">{{ auth.userInfo.userName }}</h2>
          <NSpace justify="center" :size="6">
            <NTag v-for="role in auth.userInfo.roles" :key="role" type="primary" size="small" :bordered="false">
              {{ role === 'admin' ? '管理员' : role }}
            </NTag>
          </NSpace>
        </div>
        <NDivider class="!my-16px" />
        <div class="flex-col-stretch gap-20px py-8px text-14px">
          <div class="flex items-start gap-12px">
            <icon-ic-round-person-outline class="mt-2px shrink-0 text-18px text-#999" />
            <div class="min-w-0">
              <div class="text-#999">用户名</div>
              <div class="mt-4px break-all">{{ auth.userInfo.userName }}</div>
            </div>
          </div>
          <div class="flex items-start gap-12px">
            <icon-ic-round-mail-outline class="mt-2px shrink-0 text-18px text-#999" />
            <div class="min-w-0">
              <div class="text-#999">邮箱</div>
              <NEllipsis class="mt-4px max-w-full">{{ auth.userInfo.email }}</NEllipsis>
            </div>
          </div>
          <div class="flex items-start gap-12px">
            <icon-ic-round-badge class="mt-2px shrink-0 text-18px text-#999" />
            <div>
              <div class="text-#999">用户编号</div>
              <div class="mt-4px">{{ auth.userInfo.userId }}</div>
            </div>
          </div>
        </div>
      </NCard>
    </NGi>
    <NGi span="24 m:17 l:18">
      <NCard :bordered="false" size="small" class="card-wrapper">
        <NTabs type="line" animated :tabs-padding="8">
          <NTabPane name="details" tab="基本资料"><ProfileDetails /></NTabPane>
          <NTabPane name="security" tab="安全设置"><ProfilePassword /></NTabPane>
        </NTabs>
      </NCard>
    </NGi>
  </NGrid>
</template>
