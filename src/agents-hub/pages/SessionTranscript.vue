<template>
  <div>
    <div v-if="entries.length === 0" class="tr-empty">暂无记录。</div>
    <template v-for="t in entries" :key="t.id">
      <!-- tool call -->
      <div v-if="roleOf(t) === 'TOOL'" class="tr-tool">
        <button type="button" class="tr-tool-head" @click="toggle(t.id)">
          <span class="tr-caret">{{ openMap[t.id] ? '▼' : '▶' }}</span>
          <span class="tr-tool-name">工具 · {{ t.toolName ?? 'tool' }}</span>
          <span class="tr-tool-id">{{ (t.id || '').slice(0, 10) }}</span>
        </button>
        <pre v-if="openMap[t.id]" class="tr-tool-body">{{ toolBody(t) }}</pre>
      </div>

      <!-- user / assistant / system -->
      <div v-else class="tr-bubble" :class="bubbleClass(t)">
        <div class="tr-role">{{ roleOf(t) }}</div>
        {{ t.content ?? '' }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { TurnEntry } from '../types';

defineProps<{
  entries: TurnEntry[];
}>();

const openMap = ref<Record<string, boolean>>({});

function toggle(id: string) {
  openMap.value[id] = !openMap.value[id];
}
function roleOf(t: TurnEntry): string {
  return String(t.role).toUpperCase();
}
function toolBody(t: TurnEntry): string {
  const body = t.toolResult ?? t.toolInput ?? '';
  return body ? body : '运行中…';
}
function bubbleClass(t: TurnEntry): string {
  const role = roleOf(t);
  if (role === 'USER') return 'is-user';
  if (role === 'ASSISTANT') return 'is-assistant';
  return 'is-system';
}
</script>

<style scoped lang="scss">
@use "../styles/tokens" as *;

.tr-empty {
  font-size: 12.5px;
  color: $text-3;
}

/* ---- 工具调用 ---- */
.tr-tool {
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid $border;
  border-radius: $radius-lg;
  background: $bg-panel;
}

.tr-tool-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 13px;
  border: none;
  border-bottom: 1px solid $border;
  background: $bg-sunken;
  text-align: left;
  cursor: pointer;
}

.tr-caret {
  font-size: 10px;
  color: $accent-text;
}

.tr-tool-name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  color: $accent-text;
}

.tr-tool-id {
  font-family: var(--mono);
  font-size: 10.5px;
  color: $text-4;
}

.tr-tool-body {
  max-height: 320px;
  margin: 0;
  padding: 12px 13px;
  overflow: auto;
  font-family: var(--mono);
  font-size: 11.5px;
  line-height: 1.7;
  color: $text-2;
  white-space: pre-wrap;
  word-break: break-all;
  @include thin-scroll(6px);
}

/* ---- 消息气泡 ---- */
.tr-bubble {
  margin-bottom: 14px;
  padding: 12px 15px;
  border-radius: $radius-lg;
  border: 1px solid $border;
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  color: $text-2;

  &.is-user {
    border-color: $accent-line;
    border-left: 3px solid $accent;
    background: $accent-soft;
    color: $accent-text;
  }

  &.is-assistant {
    background: $bg-panel;
  }

  &.is-system {
    border-style: dashed;
    background: $bg-sunken;
    color: $text-3;
  }
}

.tr-role {
  margin-bottom: 6px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: $text-4;
}
</style>
