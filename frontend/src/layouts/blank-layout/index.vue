<script setup lang="ts">
import GlobalContent from '../modules/global-content/index.vue';

defineOptions({
  name: 'BlankLayout'
});
</script>

<template>
  <GlobalContent :show-padding="false" />
</template>

<style lang="scss" scoped></style>
