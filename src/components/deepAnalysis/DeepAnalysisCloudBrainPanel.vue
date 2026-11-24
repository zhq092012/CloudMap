<template>
  <div class="da-cloud-brain" aria-label="云脑智能分析">
    <header class="da-cloud-brain__header">
        <div class="da-cloud-brain__header-main">
          <span class="da-cloud-brain__pin" aria-hidden="true">⌁</span>
          <h2 class="da-cloud-brain__title">云脑智能分析</h2>
          <span v-if="mock.live" class="da-cloud-brain__live">● 实时</span>
        </div>
        <div class="da-cloud-brain__header-actions">
          <button type="button" class="da-cloud-brain__icon-btn" title="更多" aria-label="更多">
            ⋯
          </button>
        </div>
    </header>

      <div class="da-cloud-brain__scroll custom-scrollbar">
        <CloudBrainSectionShell title="智能分析" icon="◑" :default-expanded="true">
          <p class="da-cloud-brain__subtitle">{{ mock.intelligentAnalysis.subtitle }}</p>
          <ul class="da-cloud-brain__list">
            <li v-for="(line, idx) in mock.intelligentAnalysis.bullets" :key="idx" class="da-cloud-brain__list-item">
              {{ line }}
            </li>
          </ul>
        </CloudBrainSectionShell>

        <CloudBrainSectionShell title="实时执行追踪" icon="⟳" :default-expanded="true">
          <ul class="da-cloud-brain__run-list">
            <li v-for="(line, idx) in mock.executionTracking.lines" :key="idx" class="da-cloud-brain__run-line"
              :class="`da-cloud-brain__run-line--${line.status}`">
              <span class="da-cloud-brain__run-agent">{{ line.agent }}：</span>
              <span class="da-cloud-brain__run-label">{{ line.label }}</span>
            </li>
          </ul>
          <p class="da-cloud-brain__run-footer">{{ mock.executionTracking.footer }}</p>
        </CloudBrainSectionShell>

        <CloudBrainSectionShell title="建议动作" icon="✦" :default-expanded="true">
          <ul class="da-cloud-brain__list">
            <li v-for="(line, idx) in mock.suggestedActions" :key="idx" class="da-cloud-brain__list-item">
              {{ line }}
            </li>
          </ul>
        </CloudBrainSectionShell>

        <CloudBrainSectionShell title="关键依据摘要" icon="◆" :default-expanded="true">
          <ul class="da-cloud-brain__list">
            <li v-for="(line, idx) in mock.keyEvidence" :key="idx" class="da-cloud-brain__list-item">
              {{ line }}
            </li>
          </ul>
        </CloudBrainSectionShell>

        <CloudBrainSectionShell title="智能终端" icon="▣" :default-expanded="true">
          <button type="button" class="da-cloud-brain__terminal-btn" @click="onTerminalCta">
            {{ mock.terminalCta }}
          </button>
        </CloudBrainSectionShell>
      </div>

      <footer class="da-cloud-brain__footer">
        <button v-for="action in mock.footerActions" :key="action.id" type="button" class="da-cloud-brain__footer-btn"
          @click="onFooterAction(action.id)">
          {{ action.label }}
        </button>
      </footer>
  </div>
</template>

<script setup lang="ts">
import CloudBrainSectionShell from "@/components/cloudBrainPanel/CloudBrainSectionShell.vue";
import { deepAnalysisCloudBrainMock } from "@/mock/deepAnalysisCloudBrain";

/** 云脑栏展示用 Mock */
const mock = deepAnalysisCloudBrainMock;

/**
 * 智能终端占位：后续接 CommandTerminal / 对话抽屉。
 */
function onTerminalCta(): void {
  // Mock 阶段无业务副作用
}

/**
 * 底栏操作占位：后续按 id 打开 Agent 链路视图或终端追问。
 * @param actionId - mock.footerActions 中的 id
 */
function onFooterAction(actionId: string): void {
  void actionId;
}
</script>

<style scoped>
.da-cloud-brain {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  user-select: none;
  background: rgba(17, 24, 39, 0.96);
}

.da-cloud-brain__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
  padding: 10px 10px 8px;
  border-bottom: 1px solid #2d3a4d;
}

.da-cloud-brain__header-main {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.da-cloud-brain__pin {
  font-size: 14px;
  color: #60a5fa;
  line-height: 1;
}

.da-cloud-brain__title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #93c5fd;
  white-space: nowrap;
}

.da-cloud-brain__live {
  flex-shrink: 0;
  margin-left: 2px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 600;
  color: #4ade80;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.35);
  border-radius: 999px;
}

.da-cloud-brain__header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.da-cloud-brain__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  font-size: 14px;
  line-height: 1;
  color: #9ca3af;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.da-cloud-brain__icon-btn:hover {
  color: #e5e7eb;
  background: #253141;
}

.da-cloud-brain__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.da-cloud-brain__subtitle {
  margin: 8px 0 6px;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
}

.da-cloud-brain__list {
  margin: 0;
  padding: 0 0 0 14px;
  list-style: disc;
}

.da-cloud-brain__list-item {
  font-size: 11.5px;
  line-height: 1.55;
  color: #9ca3af;
}

.da-cloud-brain__list-item+.da-cloud-brain__list-item {
  margin-top: 4px;
}

.da-cloud-brain__run-list {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.da-cloud-brain__run-line {
  font-size: 11.5px;
  line-height: 1.5;
  color: #9ca3af;
}

.da-cloud-brain__run-line+.da-cloud-brain__run-line {
  margin-top: 4px;
}

.da-cloud-brain__run-agent {
  color: #cbd5e1;
}

.da-cloud-brain__run-line--done .da-cloud-brain__run-label {
  color: #86efac;
}

.da-cloud-brain__run-line--running .da-cloud-brain__run-label {
  color: #fbbf24;
}

.da-cloud-brain__run-line--pending .da-cloud-brain__run-label {
  color: #6b7280;
}

.da-cloud-brain__run-footer {
  margin: 8px 0 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: #6b7280;
}

.da-cloud-brain__terminal-btn {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #93c5fd;
  text-align: center;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.da-cloud-brain__terminal-btn:hover {
  background: rgba(59, 130, 246, 0.2);
}

.da-cloud-brain__footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid #2d3a4d;
}

.da-cloud-brain__footer-btn {
  width: 100%;
  padding: 9px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #e5e7eb;
  background: linear-gradient(180deg, #1e3a5f 0%, #172554 100%);
  border: 1px solid #334155;
  border-radius: 6px;
  cursor: pointer;
  transition: filter 0.15s ease, border-color 0.15s ease;
}

.da-cloud-brain__footer-btn:hover {
  filter: brightness(1.08);
  border-color: #475569;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}
</style>