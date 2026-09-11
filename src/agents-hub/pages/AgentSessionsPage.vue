<template>
  <div v-if="!agentId" class="p-8 text-[#708aa6]">缺少智能体 id。</div>
  <div v-else class="flex h-full min-h-0 bg-[#060c14]">
    <!-- left: inbox -->
    <div class="w-[440px] flex-shrink-0 border-r border-[#142338] min-h-0 flex flex-col">
      <div class="px-5 pt-5 pb-3 flex-shrink-0">
        <h2 class="text-white text-lg font-bold m-0 mb-3">会话</h2>
        <label class="flex items-center gap-2 text-sm text-[#708aa6] cursor-pointer select-none">
          <input type="checkbox" v-model="unreadOnly" class="accent-[#00f3ff]" />
          仅未读
        </label>
      </div>
      <div class="flex-1 min-h-0 overflow-auto px-4 pb-4">
        <div v-if="err" class="text-[#ef4444] text-sm px-1 pb-2">{{ err }}</div>
        <SessionInboxList
          :entries="entries"
          :unread-only="unreadOnly"
          @select="openSession"
        />
      </div>
    </div>
    <!-- right: hint -->
    <div class="flex-1 flex items-center justify-center text-[#526e8c] text-sm">
      选择左侧会话查看详情
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Ref } from 'vue';
import * as api from '../api';
import type { InboxEntry } from '../types';
import SessionInboxList from './SessionInboxList.vue';

const agentId = inject<Ref<string | undefined>>('agentHubId');
const route = useRoute();
const router = useRouter();

const entries = ref<InboxEntry[]>([]);
const unreadOnly = ref(false);
const err = ref<string | null>(null);

async function load() {
  if (!agentId?.value) return;
  err.value = null;
  try {
    entries.value = await api.inbox(agentId.value, { limit: 50, unreadOnly: unreadOnly.value });
  } catch (e) {
    err.value = (e as Error).message;
  }
}

async function openSession(sessionKey: string) {
  if (!agentId?.value) return;
  try {
    await api.markRead(agentId.value, sessionKey);
  } catch {
    // ignore mark-read failures
  }
  router.push({ name: 'AgentHubSessionDetail', params: { id: agentId.value, sessionKey } });
}

onMounted(() => {
  load();
  const q = route.query.session;
  if (typeof q === 'string' && q && agentId?.value) {
    router.replace({ name: 'AgentHubSessionDetail', params: { id: agentId.value, sessionKey: q } });
  }
});
watch(unreadOnly, load);
watch(() => agentId?.value, () => {
  if (agentId?.value) load();
});
</script>
