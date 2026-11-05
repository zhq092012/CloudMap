<script setup lang="ts">
// ============================================================
// Ported from agentbuilder-main/frontend/src/pages/AgentSkillsPage.tsx
// The React version opened the marketplace browser in a modal; here it is a
// sibling tab so both views keep their scroll state. Installing bumps the
// refresh key so the workspace list reflects the new on-disk state.
// ============================================================
import { ref, inject } from 'vue';
import type { Ref } from 'vue';
import SkillsWorkspacePanel from './SkillsWorkspacePanel.vue';
import SkillsMarketplacesPanel from './SkillsMarketplacesPanel.vue';

const agentId = inject<Ref<string | undefined>>('agentHubId');

type TabKey = 'workspace' | 'marketplace';
const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'workspace', label: '工作区技能', icon: '🧩' },
  { key: 'marketplace', label: '技能市场', icon: '🛒' },
];

const activeTab = ref<TabKey>('workspace');
const refreshKey = ref(0);

function bumpRefresh() {
  refreshKey.value++;
}
</script>

<template>
  <div v-if="!agentId" class="sk-missing">缺少智能体 id。</div>
  <div v-else class="sk-page">
    <!-- help banner -->
    <div class="sk-banner">
      从绑定的技能市场（git / nacos）安装到该智能体
      <code>workspace/skills/</code> 目录下的技能。切换到 <b>技能市场</b> 标签浏览可安装的内容。
    </div>

    <!-- tabs -->
    <div class="sk-tabs">
      <button
        v-for="t in TABS"
        :key="t.key"
        type="button"
        class="sk-tab"
        :class="{ 'is-active': activeTab === t.key }"
        @click="activeTab = t.key"
      >
        <span class="sk-tab-icon">{{ t.icon }}</span>{{ t.label }}
      </button>
    </div>

    <!-- panels -->
    <div class="sk-body">
      <SkillsWorkspacePanel
        v-if="activeTab === 'workspace'"
        :agent-id="agentId"
        :refresh-key="refreshKey"
        @change="bumpRefresh"
        @request-browse="activeTab = 'marketplace'"
      />
      <SkillsMarketplacesPanel
        v-else
        :agent-id="agentId"
        @installed="bumpRefresh"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "../styles/tokens" as *;

.sk-missing {
  padding: 32px;
  font-size: 13px;
  color: $text-3;
}

.sk-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: $bg-root;
}

.sk-banner {
  flex: none;
  padding: 9px 22px;
  border-bottom: 1px solid $border;
  background: rgba(17, 24, 39, 0.7);
  font-size: 12px;
  line-height: 1.7;
  color: $text-3;

  code {
    padding: 1px 6px;
    border-radius: $radius-sm;
    border: 1px solid rgba(59, 130, 246, 0.18);
    background: $bg-sunken;
    color: $accent-text;
    font-size: 11.5px;
  }

  b {
    color: $text-2;
    font-weight: 600;
  }
}

.sk-tabs {
  flex: none;
  display: flex;
  gap: 2px;
  padding: 0 16px;
  border-bottom: 1px solid $border;
  background: $bg-sunken;
}

.sk-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: $text-3;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1;
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

.sk-tab-icon {
  font-size: 13px;
  line-height: 1;
}

.sk-body {
  flex: 1;
  min-height: 0;
}
</style>
