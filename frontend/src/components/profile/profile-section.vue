<script setup lang="ts">
defineProps<{ title: string; subtitle: string }>();
</script>

<template>
  <section class="profile-section">
    <div class="profile-section__body">
      <div class="profile-section__inner">
        <header class="profile-section__header">
          <div class="profile-section__icon bg-primary/10 text-primary" aria-hidden="true"><slot name="icon" /></div>
          <div class="profile-section__heading">
            <h3 :title="title">{{ title }}</h3>
            <p :title="subtitle">{{ subtitle }}</p>
          </div>
        </header>
        <slot />
      </div>
    </div>
    <footer class="profile-section__footer bg-container">
      <div class="profile-section__actions"><slot name="actions" /></div>
    </footer>
  </section>
</template>

<style scoped>
.profile-section {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.profile-section__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 32px;
}

.profile-section__inner,
.profile-section__actions {
  width: 100%;
  max-width: 720px;
  margin-inline: auto;
}

.profile-section__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.profile-section__icon {
  display: flex;
  flex: 0 0 48px;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  font-size: 26px;
}

.profile-section__heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.profile-section__heading h3,
.profile-section__heading p {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-section__heading h3 {
  font-size: 16px;
  font-weight: 500;
  line-height: 22px;
}

.profile-section__heading p {
  color: rgb(var(--base-text-color) / 0.65);
  font-size: 14px;
  line-height: 20px;
}

.profile-section__footer {
  flex-shrink: 0;
  padding: 16px 32px;
  border-top: 1px solid rgb(var(--base-text-color) / 0.09);
}

.profile-section__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 640px) {
  .profile-section__body {
    padding: 24px 16px;
  }

  .profile-section__footer {
    padding: 16px;
  }
}
</style>
