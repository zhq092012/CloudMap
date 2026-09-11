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
  <div v-if="!agentId" class="p-8 text-[#708aa6]">缺少智能体 id。</div>
  <div v-else class="flex flex-col h-full min-h-0 bg-[#060c14]">
    <!-- help banner -->
    <div class="px-6 py-2 text-[13px] text-[#708aa6] bg-[#0b131f] border-b border-[#142338]">
      从绑定的技能市场（git / nacos）安装到该智能体
      <code class="text-[#a3b8cc]">workspace/skills/</code> 目录下的技能。切换到
      <b class="text-[#a3b8cc]">技能市场</b> 标签浏览可安装的内容。
    </div>

    <!-- tabs -->
    <div class="flex gap-1 px-6 bg-[#0b131f] border-b border-[#142338] flex-shrink-0">
      <button
        v-for="t in TABS"
        :key="t.key"
        type="button"
        class="flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-medium transition-colors"
        :class="
          activeTab === t.key
            ? 'text-white border-[#00f3ff]'
            : 'text-[#708aa6] border-transparent hover:text-[#a3b8cc]'
        "
        @click="activeTab = t.key"
      >
        <span>{{ t.icon }}</span> {{ t.label }}
      </button>
    </div>

    <!-- panels -->
    <div class="flex-1 min-h-0">
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
