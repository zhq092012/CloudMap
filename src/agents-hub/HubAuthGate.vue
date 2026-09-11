<template>
  <LoginPage v-if="!authed" />
  <slot v-else />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAgentHubStore } from './store';
import LoginPage from './LoginPage.vue';

const store = useAgentHubStore();
const authed = computed(() => store.isAuthed && !!store.me);

onMounted(async () => {
  if (store.isAuthed && !store.me) {
    await store.probe();
  }
});
</script>
