<template>
  <div class="ac-page">
    <!-- header -->
    <div class="ac-head">
      <h2 class="ac-title">活动</h2>
      <span class="ac-hint">自动刷新 · 15s</span>
    </div>

    <!-- error -->
    <div v-if="err" class="ac-error">{{ err }}</div>

    <!-- empty -->
    <div v-if="!loading && timeline.length === 0 && !err" class="ac-empty">暂无活动记录。</div>

    <!-- timeline (reverse-chronological) -->
    <ol class="ac-list">
      <li v-for="(ev, idx) in timeline" :key="ev.id" class="ac-item"
        :class="{ 'is-last': idx === timeline.length - 1 }">
        <!-- avatar + connector -->
        <div class="ac-rail">
          <div class="ac-avatar">{{ actorInitial(ev) }}</div>
          <span v-if="idx !== timeline.length - 1" class="ac-line"></span>
        </div>

        <!-- card -->
        <div class="ac-card">
          <span class="ac-icon">{{ metaFor(ev.action).icon }}</span>
          <span class="ac-actor">{{ ev.actorUsername || ev.actorUserId || '某用户' }}</span>
          <span class="ac-verb" :style="{ color: metaFor(ev.action).tone }">{{ summarize(ev).primary }}</span>
          <span v-if="summarize(ev).secondary" class="ac-target">{{ summarize(ev).secondary }}</span>
          <span class="ac-grow"></span>
          <span class="ac-time" :title="new Date(ev.timestampMs).toLocaleString()">
            {{ formatRelative(ev.timestampMs) }}
          </span>
        </div>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import type { Ref } from 'vue';
import * as api from '../api';
import type { ActivityEvent } from '../types';

const RTF = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

const ACTION_META: Record<string, { icon: string; verb: string; tone: string }> = {
  CREATE:         { icon: '✨',  verb: '创建了智能体',     tone: '#93c5fd' },
  EDIT_SETTINGS:  { icon: '⚙️',  verb: '更新了设置',       tone: '#93c5fd' },
  DELETE_AGENT:   { icon: '🗑️',  verb: '删除了智能体',     tone: '#fca5a5' },
  CREATE_FILE:    { icon: '📄',  verb: '创建了文件',       tone: '#93c5fd' },
  EDIT_FILE:      { icon: '✏️',  verb: '编辑了文件',       tone: '#93c5fd' },
  DELETE_FILE:    { icon: '🗑️',  verb: '删除了文件',       tone: '#fca5a5' },
  RENAME_FILE:    { icon: '🔀',  verb: '重命名了文件',     tone: '#93c5fd' },
  UPLOAD_FILE:    { icon: '⬆️',  verb: '上传了文件',       tone: '#93c5fd' },
  GRANT_SHARE:    { icon: '🤝',  verb: '授予了访问权限',   tone: '#10b981' },
  REVOKE_SHARE:   { icon: '🚫',  verb: '撤销了访问权限',   tone: '#fca5a5' },
  CLONE_FROM:     { icon: '🔁',  verb: '从此智能体克隆',   tone: '#f59e0b' },
  CLONE_TO:       { icon: '🔁',  verb: '克隆了此智能体',   tone: '#f59e0b' },
  BIND_CHANNEL:   { icon: '📡',  verb: '绑定了渠道',       tone: '#93c5fd' },
  UNBIND_CHANNEL: { icon: '📴',  verb: '解绑了渠道',       tone: '#fca5a5' },
  EDIT_BINDING:   { icon: '📡',  verb: '编辑了渠道绑定',   tone: '#93c5fd' },
  RUN_SESSION:    { icon: '▶️',  verb: '发起了对话会话',   tone: '#93c5fd' },
};

const REDACTED_ACTIONS = new Set([
  'GRANT_SHARE', 'REVOKE_SHARE', 'BIND_CHANNEL', 'UNBIND_CHANNEL', 'EDIT_BINDING',
]);

function metaFor(action: string) {
  return ACTION_META[action] ?? {
    icon: '•',
    verb: action.toLowerCase().replace(/_/g, ' '),
    tone: '#9ca3af',
  };
}

function formatRelative(ts: number): string {
  const deltaSec = (ts - Date.now()) / 1000;
  const abs = Math.abs(deltaSec);
  if (abs < 60) return RTF.format(Math.round(deltaSec), 'second');
  if (abs < 3600) return RTF.format(Math.round(deltaSec / 60), 'minute');
  if (abs < 86400) return RTF.format(Math.round(deltaSec / 3600), 'hour');
  if (abs < 86400 * 30) return RTF.format(Math.round(deltaSec / 86400), 'day');
  if (abs < 86400 * 365) return RTF.format(Math.round(deltaSec / (86400 * 30)), 'month');
  return RTF.format(Math.round(deltaSec / (86400 * 365)), 'year');
}

function actorInitial(ev: ActivityEvent): string {
  const name = ev.actorUsername || ev.actorUserId || '?';
  return name.charAt(0).toUpperCase();
}

function summarize(ev: ActivityEvent): { primary: string; secondary: string | null } {
  const m = metaFor(ev.action);
  const redacted = REDACTED_ACTIONS.has(ev.action) && !ev.target;
  if (redacted) {
    if (ev.action === 'GRANT_SHARE' || ev.action === 'REVOKE_SHARE') {
      return { primary: '拥有者更新了共享设置', secondary: null };
    }
    return { primary: '拥有者更新了渠道绑定', secondary: null };
  }
  let secondary: string | null = ev.target ?? null;
  if (ev.action === 'GRANT_SHARE' && ev.metadata && typeof ev.metadata.tier === 'string') {
    secondary = `${ev.target ?? ''} · ${ev.metadata.tier}`;
  }
  if (
    (ev.action === 'CLONE_FROM' || ev.action === 'CLONE_TO') &&
    ev.metadata &&
    typeof ev.metadata.files === 'number'
  ) {
    secondary = `${ev.target ?? ''} · ${ev.metadata.files} 个文件`;
  }
  return { primary: m.verb, secondary };
}

const agentId = inject<Ref<string | undefined>>('agentHubId');

const events = ref<ActivityEvent[]>([]);
const err = ref<string | null>(null);
const loading = ref(true);

let focused = true;
let timer: number | null = null;

const timeline = computed(() =>
  [...events.value].sort((a, b) => b.timestampMs - a.timestampMs),
);

async function refresh() {
  if (!agentId?.value) {
    loading.value = false;
    return;
  }
  try {
    events.value = await api.listActivity(agentId.value, { limit: 100 });
    err.value = null;
  } catch (e) {
    err.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

function onVis() {
  focused = !document.hidden;
}

watch(
  () => agentId?.value,
  () => {
    loading.value = true;
    refresh();
  },
  { immediate: true },
);

onMounted(() => {
  document.addEventListener('visibilitychange', onVis);
  timer = window.setInterval(() => {
    if (focused) refresh();
  }, 15000);
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVis);
  if (timer !== null) window.clearInterval(timer);
});
</script>

<style scoped lang="scss">
@use "../styles/tokens" as *;

.ac-page {
  max-width: 880px;
  margin: 0 auto;
  padding: 26px 32px 34px;
  height: 100%;
  overflow-y: auto;
  background: $bg-root;
  @include thin-scroll;
}

.ac-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.ac-title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.2px;
  color: $text;
}

.ac-hint {
  font-size: 11px;
  color: $text-4;
}

.ac-error {
  margin-bottom: 14px;
  padding: 9px 12px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: $radius-md;
  background: $red-soft;
  font-size: 12px;
  line-height: 1.7;
  color: #fca5a5;
}

.ac-empty {
  padding: 34px 0;
  border: 1px dashed $border;
  border-radius: $radius-lg;
  background: rgba(26, 35, 50, 0.6);
  text-align: center;
  font-size: 12.5px;
  color: $text-3;
}

.ac-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.ac-item {
  position: relative;
  display: flex;
  gap: 12px;
  padding-bottom: 14px;

  &.is-last {
    padding-bottom: 0;
  }
}

.ac-rail {
  position: relative;
  flex: none;
  width: 34px;
  display: flex;
  justify-content: center;
}

.ac-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  font-size: 12.5px;
  font-weight: 700;
  background: linear-gradient(135deg, $accent 0%, #2563eb 100%);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.28);
}

.ac-line {
  position: absolute;
  top: 36px;
  bottom: -14px;
  width: 2px;
  border-radius: 1px;
  background: $border;
}

.ac-card {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 11px 14px;
  border: 1px solid $border;
  border-radius: $radius-lg;
  background: $bg-panel;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: border-color $ease, background $ease;

  &:hover {
    border-color: $border-strong;
    background: $bg-elevated;
  }
}

.ac-icon {
  font-size: 12.5px;
  line-height: 1;
}

.ac-actor {
  font-size: 12.5px;
  font-weight: 600;
  color: $text;
}

.ac-verb {
  font-size: 12.5px;
  font-weight: 500;
}

.ac-target {
  padding: 1px 7px;
  border-radius: $radius-sm;
  border: 1px solid $border;
  background: $bg-sunken;
  font-family: var(--mono);
  font-size: 11px;
  color: $text-3;
}

.ac-grow {
  flex: 1;
}

.ac-time {
  font-size: 11px;
  color: $text-4;
}
</style>
