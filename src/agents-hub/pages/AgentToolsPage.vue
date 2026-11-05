<template>
  <div v-if="!agentId" class="tl-missing">缺少智能体 id。</div>
  <div v-else class="tl-page">
    <!-- help banner -->
    <div class="tl-banner">
      该智能体本次会话可调用的工具。内置工具来自运行时；MCP 服务通过
      <code>workspace/tools.json</code> 接入。这里的开关会改写该文件 —— 变更在下次启动会话时生效。
    </div>

    <!-- active panel -->
    <div class="tl-body">
      <ToolsActivePanel
        :agent-id="agentId"
        :refresh-key="refreshKey"
        @change="bumpRefresh"
        @request-browse="browseOpen = true"
      />
    </div>

    <!-- catalog modal -->
    <div v-if="browseOpen" class="tl-overlay" @click="browseOpen = false">
      <div class="tl-modal" @click.stop>
        <div class="tl-modal-head">
          <div class="tl-modal-title-wrap">
            <div class="tl-modal-title">配置工具</div>
            <div class="tl-modal-sub">启用 / 停用内置工具，或新增一个 MCP 服务。</div>
          </div>
          <button type="button" class="tl-close" @click="browseOpen = false">关闭</button>
        </div>
        <div class="tl-modal-body">
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

<style scoped lang="scss">
@use "../styles/tokens" as *;

.tl-missing {
  padding: 32px;
  font-size: 13px;
  color: $text-3;
}

.tl-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: $bg-root;
}

.tl-banner {
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
}

.tl-body {
  flex: 1;
  min-height: 0;
}

/* ---- 工具目录弹窗 ---- */
.tl-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4, 7, 13, 0.72);
  backdrop-filter: blur(2px);
}

.tl-modal {
  display: flex;
  flex-direction: column;
  width: min(820px, 92vw);
  height: min(640px, 86vh);
  overflow: hidden;
  border: 1px solid $border;
  border-radius: $radius-lg;
  background: $bg-panel;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55);
}

.tl-modal-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid $border;
}

.tl-modal-title-wrap {
  flex: 1;
  min-width: 0;
}

.tl-modal-title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: $text;
}

.tl-modal-sub {
  margin-top: 3px;
  font-size: 11.5px;
  line-height: 1.6;
  color: $text-3;
}

.tl-close {
  flex: none;
  height: 28px;
  padding: 0 12px;
  border-radius: $radius-md;
  border: 1px solid $border;
  background: $bg-sunken;
  color: $text-2;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: color $ease, border-color $ease, background $ease;

  &:hover {
    color: $accent-text;
    border-color: $accent-line;
    background: $accent-soft;
  }
}

.tl-modal-body {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
</style>
