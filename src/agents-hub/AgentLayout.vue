<template>
  <HubAuthGate>
    <div class="h-full flex flex-col bg-[#060c14] text-[#a3b8cc] min-h-0">
      <div v-if="!id" class="p-8 text-[#708aa6]">缺少智能体 id。</div>

      <!-- header -->
      <div v-else class="px-8 pt-5 pb-0 border-b border-[#1a2b42] bg-[#0b131f]/60 flex-shrink-0">
        <div class="flex items-center gap-3.5 mb-4 flex-wrap">
          <span class="w-11 h-11 rounded-xl flex items-center justify-center text-2xl border border-[#2b5384]"
            style="background: linear-gradient(135deg,#0b2030 0%,#102a44 100%);">🤖</span>
          <div class="flex flex-col gap-0.5 min-w-0">
            <span class="text-xl font-bold text-white tracking-tight">{{ agent?.name ?? id }}</span>
            <span v-if="agent?.description" class="text-[13px] text-[#708aa6] truncate max-w-[520px]">{{ agent.description }}</span>
          </div>

          <span v-if="agent" class="ml-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
            :class="agent.scope === 'global'
              ? 'bg-[#0b1e2e] text-[#7fd4ff] border-[#1d3a57]'
              : 'bg-[#0f1927] text-[#708aa6] border-[#1e324f]'">
            {{ agent.scope }}
          </span>
          <span v-if="tier && tier !== 'EDIT' && agent && !isGlobal"
            class="px-2.5 py-1 rounded-full text-xs font-semibold border"
            :class="tier === 'RUN' ? 'bg-[#0b2e1f] text-[#00ffc4] border-[#1d4a38]' : 'bg-[#2e240b] text-[#fbbf24] border-[#4a3a1d]'">
            {{ tier === 'RUN' ? '共享 · 可运行' : '🔁 仅可克隆' }}
          </span>

          <span class="flex-1"></span>
          <button @click="close"
            title="关闭并返回智能体中心"
            class="w-9 h-9 rounded-lg border border-[#1e324f] text-[#708aa6] hover:text-white hover:border-[#2b5384] hover:bg-[#10243a] flex items-center justify-center text-lg leading-none transition-colors flex-shrink-0">
            ✕
          </button>
          <button v-if="canEdit" @click="shareOpen = true"
            class="px-3.5 py-1.5 rounded-lg border border-[#2b5384] text-[#7fd4ff] hover:bg-[#10243a] text-sm font-semibold transition-colors">
            ↗ 共享
          </button>
          <span v-if="err" class="ml-3 text-[#ef4444] text-sm">{{ err }}</span>
        </div>

        <!-- tabs -->
        <div v-if="!isCloneOnly" class="flex gap-1 overflow-x-auto">
          <button v-for="t in visibleTabs" :key="t.key" @click="go(t)"
            class="flex items-center gap-2 px-4 py-3 border-b-2 transition-colors text-sm font-medium"
            :class="activeKey === t.key
              ? 'text-white border-[#00f3ff]'
              : 'text-[#708aa6] border-transparent hover:text-[#a3b8cc]'">
            <span>{{ t.icon }}</span> {{ t.label }}
          </button>
        </div>
      </div>

      <!-- body -->
      <div v-if="id" class="flex-1 min-h-0 overflow-auto bg-[#060c14]">
        <div v-if="isCloneOnly" class="p-12">
          <div class="bg-[#0f1927] border border-[#4a3a1d] rounded-xl p-7 max-w-2xl"
            style="box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
            <span class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#2e240b] text-[#fbbf24] border border-[#4a3a1d] text-xs font-semibold mb-3">🔁 仅可克隆</span>
            <h2 class="text-2xl font-bold text-white m-0 mb-2">{{ agent?.name }}</h2>
            <p class="text-[#708aa6] text-sm leading-relaxed m-0 mb-4">
              {{ agent?.description || '拥有者已授予你克隆权限。将此智能体复制到你的命名空间后即可运行或编辑。' }}
            </p>
            <button @click="cloneAndGo" class="px-5 py-2.5 rounded-lg font-semibold text-white text-sm transition-all"
              style="background: linear-gradient(135deg,#00f3ff 0%,#3b82f6 100%); box-shadow: 0 2px 6px rgba(0,243,255,0.35);">
              🔁 克隆智能体
            </button>
          </div>
        </div>
        <router-view v-else />
      </div>

      <ShareAgentDialog v-if="shareOpen && agent" :agent="agent" @close="shareOpen = false" />
    </div>
  </HubAuthGate>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import HubAuthGate from './HubAuthGate.vue';
import ShareAgentDialog from './ShareAgentDialog.vue';
import { useAgentHubStore } from './store';
import type { AgentDefinition, ShareTier } from './types';

type TierMin = ShareTier;
const TIER_RANK: Record<ShareTier, number> = { CLONE: 1, RUN: 2, EDIT: 3 };
function tierImplies(have: ShareTier | null, need: TierMin): boolean {
  if (!have) return false;
  return TIER_RANK[have] >= TIER_RANK[need];
}

const TABS: { key: string; label: string; icon: string; minTier: TierMin; routeName: string }[] = [
  { key: 'chat', label: '对话', icon: '💬', minTier: 'RUN', routeName: 'AgentHubChat' },
  { key: 'workspace', label: '工作区', icon: '📁', minTier: 'RUN', routeName: 'AgentHubWorkspace' },
  { key: 'skills', label: '技能', icon: '🧩', minTier: 'RUN', routeName: 'AgentHubSkills' },
  { key: 'tools', label: '工具', icon: '🛠️', minTier: 'RUN', routeName: 'AgentHubTools' },
  { key: 'subagents', label: '子智能体', icon: '🤝', minTier: 'RUN', routeName: 'AgentHubSubagents' },
  { key: 'sessions', label: '会话', icon: '📋', minTier: 'EDIT', routeName: 'AgentHubSessions' },
  { key: 'channels', label: '渠道', icon: '📡', minTier: 'RUN', routeName: 'AgentHubAgentChannels' },
  { key: 'activity', label: '活动', icon: '🕒', minTier: 'RUN', routeName: 'AgentHubActivity' },
  { key: 'settings', label: '设置', icon: '⚙️', minTier: 'RUN', routeName: 'AgentHubSettings' },
];

const route = useRoute();
const router = useRouter();
const store = useAgentHubStore();

const id = computed(() => route.params.id as string | undefined);
const agent = ref<AgentDefinition | null>(null);
const err = ref('');
const shareOpen = ref(false);

const tier = computed(() => agent.value?.tierForCurrentUser ?? null);
const isGlobal = computed(() => agent.value?.scope === 'global');
const canEdit = computed(() => !isGlobal.value && tier.value === 'EDIT');
const isCloneOnly = computed(() => tier.value === 'CLONE');

const visibleTabs = computed(() =>
  TABS.filter((t) => (isGlobal.value ? t.minTier !== 'EDIT' : tierImplies(tier.value, t.minTier))),
);
const activeKey = computed(() => TABS.find((t) => route.name === t.routeName)?.key ?? 'chat');

// Provide the resolved agent to child tab pages.
provide('agentHubId', id);
provide('agentHubAgent', agent);

async function load() {
  if (!id.value) return;
  err.value = '';
  agent.value = await store.fetchAgent(id.value);
  if (!agent.value) err.value = store.error;
}
watch(id, load, { immediate: false });
onMounted(load);

function go(t: { routeName: string }) {
  if (!id.value) return;
  router.push({ name: t.routeName, params: { id: id.value } });
}
// Close the opened agent page and return to the hub list (the page before opening).
function close() {
  router.push({ name: 'AgentsHub' });
}
async function cloneAndGo() {
  if (!id.value) return;
  try {
    const clone = await store.cloneAgent(id.value, {});
    router.push({ name: 'AgentsHub', query: { clone: clone.id } });
  } catch (e) {
    err.value = (e as Error).message || '克隆失败';
  }
}
</script>
