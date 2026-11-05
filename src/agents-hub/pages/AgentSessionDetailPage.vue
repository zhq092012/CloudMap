<template>
  <div v-if="!agentId" class="sd-missing">缺少智能体 id。</div>
  <div v-else-if="!sessionKey" class="sd-missing">缺少会话 key。</div>
  <div v-else class="sd-page">
    <!-- toolbar -->
    <div class="sd-toolbar">
      <button type="button" class="sd-ghost is-accent" @click="back">← 返回</button>
      <h2 class="sd-title">会话详情</h2>
      <span class="sd-grow"></span>
      <button type="button" class="sd-ghost" :disabled="busy" @click="onReset">重置</button>
      <button type="button" class="sd-ghost is-danger" :disabled="busy" @click="onDelete">删除</button>
    </div>

    <div class="sd-key" :title="sessionKey">{{ sessionKey }}</div>
    <div v-if="err" class="sd-err">{{ err }}</div>

    <!-- transcript -->
    <div class="sd-transcript">
      <SessionTranscript :entries="entries" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as api from '../api';
import type { TurnEntry } from '../types';
import SessionTranscript from './SessionTranscript.vue';

const route = useRoute();
const router = useRouter();

const agentId = computed(() => route.params.id as string | undefined);
const sessionKey = computed(() => route.params.sessionKey as string | undefined);

const entries = ref<TurnEntry[]>([]);
const err = ref<string | null>(null);
const busy = ref(false);

async function load() {
  if (!agentId.value || !sessionKey.value) return;
  err.value = null;
  try {
    entries.value = await api.turns(agentId.value, sessionKey.value);
  } catch (e) {
    err.value = (e as Error).message;
  }
}
async function markReadSafe() {
  if (!agentId.value || !sessionKey.value) return;
  try {
    await api.markRead(agentId.value, sessionKey.value);
  } catch {
    // ignore mark-read failures
  }
}
function back() {
  if (agentId.value) {
    router.push({ name: 'AgentHubSessions', params: { id: agentId.value } });
  } else {
    router.back();
  }
}
async function onReset() {
  if (!agentId.value || !sessionKey.value) return;
  if (!window.confirm('重置该会话？历史记录将被清空。')) return;
  err.value = null;
  busy.value = true;
  try {
    await api.resetSession(agentId.value, sessionKey.value);
    await load();
  } catch (e) {
    err.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
async function onDelete() {
  if (!agentId.value || !sessionKey.value) return;
  if (!window.confirm('彻底删除该会话？')) return;
  err.value = null;
  busy.value = true;
  try {
    await api.deleteSession(agentId.value, sessionKey.value);
    router.push({ name: 'AgentHubSessions', params: { id: agentId.value }, replace: true });
  } catch (e) {
    err.value = (e as Error).message;
    busy.value = false;
  }
}

onMounted(() => {
  load();
  markReadSafe();
});
watch([agentId, sessionKey], () => {
  load();
  markReadSafe();
});
</script>

<style scoped lang="scss">
@use "../styles/tokens" as *;

.sd-missing {
  padding: 32px;
  font-size: 13px;
  color: $text-3;
}

.sd-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: $bg-root;
}

.sd-toolbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-bottom: 1px solid $border;
  background: $bg-sunken;
}

.sd-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: $text;
}

.sd-grow {
  flex: 1;
}

.sd-ghost {
  height: 28px;
  padding: 0 12px;
  border-radius: $radius-md;
  border: 1px solid $border;
  background: $bg-panel;
  color: $text-2;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: color $ease, border-color $ease, background $ease;

  &:hover:not(:disabled) {
    color: $accent-text;
    border-color: $accent-line;
    background: $accent-soft;
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }

  &.is-accent {
    color: $accent-text;
    border-color: $accent-line;
  }

  &.is-danger:hover:not(:disabled) {
    color: #fca5a5;
    border-color: $red-line;
    background: $red-soft;
  }
}

.sd-key {
  flex: none;
  padding: 10px 20px 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--mono);
  font-size: 11px;
  color: $text-4;
}

.sd-err {
  flex: none;
  padding: 0 20px 4px;
  font-size: 12px;
  color: $red;
}

.sd-transcript {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px 20px 24px;
  @include thin-scroll;
}
</style>
