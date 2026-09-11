<template>
  <div v-if="!agentId" class="p-8 text-[#708aa6]">缺少智能体 id。</div>
  <div v-else-if="!sessionKey" class="p-8 text-[#708aa6]">缺少会话 key。</div>
  <div v-else class="flex flex-col h-full min-h-0 bg-[#060c14]">
    <!-- toolbar -->
    <div class="flex items-center gap-3 px-5 py-3 border-b border-[#142338] bg-[#0b131f] flex-shrink-0">
      <button
        type="button"
        @click="back"
        class="px-3 py-1.5 rounded-lg border border-[#2b5384] text-[#7fd4ff] hover:bg-[#10243a] text-sm font-semibold"
      >
        ← 返回
      </button>
      <h2 class="text-white text-lg font-bold m-0">会话详情</h2>
      <span class="flex-1"></span>
      <button
        type="button"
        :disabled="busy"
        @click="onReset"
        class="px-3 py-1.5 rounded-lg border border-[#2b5384] text-[#a3b8cc] hover:bg-[#10243a] text-sm disabled:opacity-40"
      >
        重置
      </button>
      <button
        type="button"
        :disabled="busy"
        @click="onDelete"
        class="px-3 py-1.5 rounded-lg border border-[#ef4444]/50 text-[#ef4444] hover:bg-[#2a0f12] text-sm disabled:opacity-40"
      >
        删除
      </button>
    </div>

    <div class="px-5 pt-3 pb-1 text-xs text-[#526e8c] font-mono truncate" :title="sessionKey">
      {{ sessionKey }}
    </div>
    <div v-if="err" class="px-5 text-[#ef4444] text-sm">{{ err }}</div>

    <!-- transcript -->
    <div class="flex-1 min-h-0 overflow-auto px-5 py-4">
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
