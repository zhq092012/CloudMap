<template>
  <div v-if="!agentId" class="p-8 text-[#708aa6]">缺少智能体 id。</div>
  <div v-else class="flex flex-col h-full min-h-0 bg-[#060c14]">
    <!-- help banner -->
    <div class="px-6 py-2 text-[13px] text-[#708aa6] bg-[#0b131f] border-b border-[#142338]">
      Tools the agent can call this session. Built-in tools come from the harness;
      MCP servers are wired through <code class="text-[#a3b8cc]">workspace/tools.json</code>. Toggling here
      edits that file — the change applies to the next session boot.
    </div>

    <!-- active panel -->
    <div class="flex-1 min-h-0">
      <ToolsActivePanel
        :agent-id="agentId"
        :refresh-key="refreshKey"
        @change="bumpRefresh"
        @request-browse="browseOpen = true"
      />
    </div>

    <!-- catalog modal -->
    <div v-if="browseOpen"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-[#060c14]/70"
      @click="browseOpen = false">
      <div class="flex flex-col w-[min(820px,92vw)] h-[min(640px,86vh)] rounded-xl overflow-hidden border border-[#2b5384] bg-[#0b131f] shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
        @click.stop>
        <div class="flex items-center gap-3 px-5 py-3.5 border-b border-[#142338]">
          <div class="flex-1">
            <div class="text-base font-semibold text-white">Configure tools</div>
            <div class="text-[13px] text-[#708aa6] mt-0.5">Enable / disable built-in tools or add an MCP server.</div>
          </div>
          <button type="button" @click="browseOpen = false"
            class="px-3.5 py-1.5 rounded-lg border border-[#1e324f] bg-[#0f1927] text-[#a3b8cc] text-sm font-semibold hover:bg-[#142338]">Close</button>
        </div>
        <div class="flex-1 min-h-0 overflow-hidden relative">
          <ToolsCatalogPanel :agent-id="agentId" @saved="bumpRefresh" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue';
import type { Ref } from 'vue';
import ToolsActivePanel from './ToolsActivePanel.vue';
import ToolsCatalogPanel from './ToolsCatalogPanel.vue';

const agentId = inject<Ref<string | undefined>>('agentHubId');

const refreshKey = ref(0);
const browseOpen = ref(false);

function bumpRefresh() {
  refreshKey.value++;
}
</script>
