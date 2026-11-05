<template>
  <div v-if="!agentId" class="ss-missing">缺少智能体 id。</div>
  <div v-else class="ss-page">
    <!-- left: inbox -->
    <div class="ss-inbox">
      <div class="ss-inbox-head">
        <h2 class="ss-title">会话</h2>
        <label class="ss-filter">
          <input type="checkbox" v-model="unreadOnly" />
          <span>仅未读</span>
        </label>
      </div>
      <div class="ss-inbox-list">
        <div v-if="err" class="ss-err">{{ err }}</div>
        <SessionInboxList
          :entries="entries"
          :unread-only="unreadOnly"
          @select="openSession"
        />
      </div>
    </div>
    <!-- right: hint -->
    <div class="ss-empty">
      <span class="ss-empty-icon">📋</span>
      <span>选择左侧会话查看详情</span>
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

<style scoped lang="scss">
@use "../styles/tokens" as *;

.ss-missing {
  padding: 32px;
  font-size: 13px;
  color: $text-3;
}

.ss-page {
  display: flex;
  height: 100%;
  min-height: 0;
  background: $bg-root;
}

.ss-inbox {
  flex: none;
  width: 400px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid $border;
  background: rgba(17, 24, 39, 0.35);
}

.ss-inbox-head {
  flex: none;
  padding: 18px 20px 12px;
}

.ss-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: $text;
}

.ss-filter {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: $text-3;
  cursor: pointer;
  user-select: none;

  input {
    width: 13px;
    height: 13px;
    margin: 0;
    accent-color: $accent;
    cursor: pointer;
  }

  &:hover {
    color: $text-2;
  }
}

.ss-inbox-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 16px 18px;
  @include thin-scroll(6px);
}

.ss-err {
  padding: 0 2px 8px;
  font-size: 12px;
  color: $red;
}

.ss-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 12.5px;
  color: $text-4;
}

.ss-empty-icon {
  font-size: 22px;
  opacity: 0.5;
}
</style>
