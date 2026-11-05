<template>
  <HubAuthGate>
    <div class="agent-shell">
      <div v-if="!id" class="agent-missing">缺少智能体 id。</div>

      <!-- header -->
      <header v-else class="agent-head">
        <div class="agent-head-main">
          <span class="agent-avatar">🤖</span>
          <div class="agent-identity">
            <span class="agent-name">{{ agent?.name ?? id }}</span>
            <span v-if="agent?.description" class="agent-desc">{{ agent.description }}</span>
          </div>

          <span v-if="agent" class="agent-chip" :class="agent.scope === 'global' ? 'is-accent' : 'is-muted'">
            {{ agent.scope }}
          </span>
          <span v-if="tier && tier !== 'EDIT' && agent && !isGlobal" class="agent-chip"
            :class="tier === 'RUN' ? 'is-ok' : 'is-warn'">
            {{ tier === 'RUN' ? '共享 · 可运行' : '🔁 仅可克隆' }}
          </span>

          <span class="agent-spacer"></span>
          <button @click="close" title="关闭并返回智能体中心" class="agent-icon-btn">✕</button>
          <button v-if="canEdit" @click="shareOpen = true" class="agent-soft-btn">↗ 共享</button>
          <span v-if="err" class="agent-err">{{ err }}</span>
        </div>

        <!-- tabs -->
        <nav v-if="!isCloneOnly" class="agent-tabs">
          <button v-for="t in visibleTabs" :key="t.key" @click="go(t)" class="agent-tab"
            :class="{ 'is-active': activeKey === t.key }">
            <span class="agent-tab-icon">{{ t.icon }}</span>{{ t.label }}
          </button>
        </nav>
      </header>

      <!-- body -->
      <div v-if="id" class="agent-body">
        <div v-if="isCloneOnly" class="agent-clone-wrap">
          <div class="agent-clone-card">
            <span class="agent-chip is-warn agent-clone-tag">🔁 仅可克隆</span>
            <h2 class="agent-clone-title">{{ agent?.name }}</h2>
            <p class="agent-clone-text">
              {{ agent?.description || '拥有者已授予你克隆权限。将此智能体复制到你的命名空间后即可运行或编辑。' }}
            </p>
            <button @click="cloneAndGo" class="agent-primary-btn">🔁 克隆智能体</button>
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

<style scoped lang="scss">
@use "./styles/tokens" as *;

.agent-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: $bg-root;
  color: $text-2;
}

.agent-missing {
  padding: 32px;
  font-size: 13px;
  color: $text-3;
}

/* ---------- 头部 ---------- */
.agent-head {
  flex: none;
  padding: 18px 30px 0;
  border-bottom: 1px solid $border;
  background: linear-gradient(180deg, rgba(26, 35, 50, 0.85) 0%, rgba(17, 24, 39, 0.35) 100%);
}

.agent-head-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}

.agent-avatar {
  flex: none;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-lg;
  font-size: 18px;
  line-height: 1;
  background: linear-gradient(135deg, $accent 0%, #2563eb 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.28);
}

.agent-identity {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.agent-name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.2px;
  line-height: 1.25;
  color: $text;
}

.agent-desc {
  max-width: 520px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  line-height: 1.5;
  color: $text-3;
}

.agent-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 9px;
  border-radius: 10px;
  border: 1px solid $border;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.7;
  white-space: nowrap;

  &.is-muted {
    background: $bg-panel;
    color: $text-3;
  }

  &.is-accent {
    background: $accent-soft;
    border-color: $accent-line;
    color: $accent-text;
  }

  &.is-ok {
    background: $green-soft;
    border-color: $green-line;
    color: $green;
  }

  &.is-warn {
    background: $orange-soft;
    border-color: $orange-line;
    color: $orange;
  }
}

.agent-spacer {
  flex: 1;
}

.agent-icon-btn {
  flex: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  border: 1px solid $border;
  background: transparent;
  color: $text-3;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: color $ease, border-color $ease, background $ease;

  &:hover {
    color: $text;
    border-color: $border-strong;
    background: $accent-soft;
  }
}

.agent-soft-btn {
  flex: none;
  height: 32px;
  padding: 0 13px;
  border-radius: $radius-md;
  border: 1px solid $border;
  background: transparent;
  color: $text-2;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: color $ease, border-color $ease, background $ease;

  &:hover {
    color: $accent-text;
    border-color: $accent-line;
    background: $accent-soft;
  }
}

.agent-err {
  margin-left: 4px;
  font-size: 12.5px;
  color: $red;
}

/* ---------- 页签 ---------- */
.agent-tabs {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  @include thin-scroll(6px);

  &::-webkit-scrollbar {
    height: 0;
  }
}

.agent-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  height: 38px;
  padding: 0 14px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: $text-3;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: color $ease, border-color $ease, background $ease;

  &:hover {
    color: $text;
    background: rgba(59, 130, 246, 0.06);
  }

  &.is-active {
    color: $accent-text;
    border-bottom-color: $accent;
    font-weight: 600;
  }
}

.agent-tab-icon {
  font-size: 13px;
  line-height: 1;
}

/* ---------- 主体 ---------- */
.agent-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: $bg-root;
}

.agent-clone-wrap {
  padding: 44px 34px;
}

.agent-clone-card {
  @include card;
  max-width: 620px;
  padding: 26px 28px;
  border-color: $orange-line;
}

.agent-clone-tag {
  margin-bottom: 12px;
}

.agent-clone-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.2px;
  color: $text;
}

.agent-clone-text {
  margin: 0 0 18px;
  font-size: 12.5px;
  line-height: 1.75;
  color: $text-3;
}

.agent-primary-btn {
  height: 34px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: $radius-md;
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  @include accent-gradient;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.32);
  transition: box-shadow $ease;

  &:hover {
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.42);
  }
}
</style>
