<template>
  <ChatPanel :agent-id="id" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ChatPanel from '../ChatPanel.vue';

const route = useRoute();
const id = computed(() => route.params.id as string);
</script>
