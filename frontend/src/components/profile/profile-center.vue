<script setup lang="ts">
import ProfileDetails from './profile-details.vue';
import ProfilePassword from './profile-password.vue';
</script>

<template>
  <div class="profile-page">
    <NCard
      :bordered="false"
      size="small"
      class="card-wrapper profile-card"
      :content-style="{ display: 'flex', flexDirection: 'column', minHeight: '0', padding: '0' }"
    >
      <NTabs type="line" :tabs-padding="24" class="profile-tabs">
        <NTabPane name="details" tab="基本资料" display-directive="show"><ProfileDetails /></NTabPane>
        <NTabPane name="security" tab="安全设置" display-directive="show"><ProfilePassword /></NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>

<style lang="scss" scoped>
.profile-page,
.profile-card,
.profile-tabs {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.profile-card {
  overflow: hidden;
}

.profile-tabs {
  :deep(.n-tabs-nav) {
    flex-shrink: 0;
  }

  :deep(.n-tab-pane) {
    display: flex;
    flex: 1;
    min-height: 0;
    padding: 0;
  }

  :deep(.profile-form) {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
}
</style>
