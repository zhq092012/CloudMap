<template>
  <div class="px-11 py-8 max-w-[880px] mx-auto">
    <!-- header -->
    <div class="flex items-baseline justify-between mb-[22px]">
      <h2 class="m-0 text-xl font-bold text-white tracking-tight">活动</h2>
      <span class="text-[0.78rem] text-[#708aa6]">自动刷新 · 15s</span>
    </div>

    <!-- error -->
    <div v-if="err"
      class="px-3.5 py-2.5 rounded-lg bg-[#2a1315] border border-[#5a2326] text-[#ef4444] text-[0.85rem] mb-[18px]">
      {{ err }}
    </div>

    <!-- empty -->
    <div v-if="!loading && timeline.length === 0 && !err"
      class="px-6 py-10 text-center text-[#708aa6] bg-[#0f1927] rounded-xl border border-dashed border-[#1e324f]">
      暂无活动记录。
    </div>

    <!-- timeline (reverse-chronological) -->
    <ol class="list-none m-0 p-0 flex flex-col gap-0">
      <li v-for="(ev, idx) in timeline" :key="ev.id" class="flex gap-3.5 relative"
        :class="idx === timeline.length - 1 ? 'pb-0' : 'pb-[18px]'">
        <!-- avatar + connector -->
        <div class="relative flex-shrink-0 w-10 flex justify-center">
          <div class="w-9 h-9 rounded-full flex items-center justify-center text-[0.9rem] font-bold text-white"
            style="background: linear-gradient(135deg,#3b82f6 0%,#00f3ff 100%);
                   box-shadow: 0 1px 3px rgba(0,243,255,0.35), inset 0 1px 0 rgba(255,255,255,0.18);">
            {{ actorInitial(ev) }}
          </div>
          <span v-if="idx !== timeline.length - 1"
            class="absolute top-[38px] bottom-[-18px] w-0.5 bg-[#1e324f]"></span>
        </div>

        <!-- card -->
        <div class="flex-1 bg-[#0f1927] border border-[#1e324f] rounded-[10px] px-4 py-3"
          style="box-shadow: 0 1px 2px rgba(0,0,0,0.3);">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[0.95rem]">{{ metaFor(ev.action).icon }}</span>
            <span class="font-semibold text-white text-sm">
              {{ ev.actorUsername || ev.actorUserId || '某用户' }}
            </span>
            <span class="font-medium text-[0.88rem]" :style="{ color: metaFor(ev.action).tone }">
              {{ summarize(ev).primary }}
            </span>
            <span v-if="summarize(ev).secondary"
              class="px-2 py-0.5 rounded-md bg-[#142338] text-[#a3b8cc] text-[0.78rem]"
              style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">
              {{ summarize(ev).secondary }}
            </span>
            <span class="flex-1"></span>
            <span :title="new Date(ev.timestampMs).toLocaleString()" class="text-[0.78rem] text-[#708aa6]">
              {{ formatRelative(ev.timestampMs) }}
            </span>
          </div>
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
  CREATE:         { icon: '✨',  verb: '创建了智能体',     tone: '#3b82f6' },
  EDIT_SETTINGS:  { icon: '⚙️',  verb: '更新了设置',       tone: '#00f3ff' },
  DELETE_AGENT:   { icon: '🗑️',  verb: '删除了智能体',     tone: '#ef4444' },
  CREATE_FILE:    { icon: '📄',  verb: '创建了文件',       tone: '#00f3ff' },
  EDIT_FILE:      { icon: '✏️',  verb: '编辑了文件',       tone: '#00f3ff' },
  DELETE_FILE:    { icon: '🗑️',  verb: '删除了文件',       tone: '#ef4444' },
  RENAME_FILE:    { icon: '🔀',  verb: '重命名了文件',     tone: '#00f3ff' },
  UPLOAD_FILE:    { icon: '⬆️',  verb: '上传了文件',       tone: '#00f3ff' },
  GRANT_SHARE:    { icon: '🤝',  verb: '授予了访问权限',   tone: '#00ffc4' },
  REVOKE_SHARE:   { icon: '🚫',  verb: '撤销了访问权限',   tone: '#ef4444' },
  CLONE_FROM:     { icon: '🔁',  verb: '从此智能体克隆',   tone: '#fbbf24' },
  CLONE_TO:       { icon: '🔁',  verb: '克隆了此智能体',   tone: '#fbbf24' },
  BIND_CHANNEL:   { icon: '📡',  verb: '绑定了渠道',       tone: '#00f3ff' },
  UNBIND_CHANNEL: { icon: '📴',  verb: '解绑了渠道',       tone: '#ef4444' },
  EDIT_BINDING:   { icon: '📡',  verb: '编辑了渠道绑定',   tone: '#00f3ff' },
  RUN_SESSION:    { icon: '▶️',  verb: '发起了对话会话',   tone: '#3b82f6' },
};

const REDACTED_ACTIONS = new Set([
  'GRANT_SHARE', 'REVOKE_SHARE', 'BIND_CHANNEL', 'UNBIND_CHANNEL', 'EDIT_BINDING',
]);

function metaFor(action: string) {
  return ACTION_META[action] ?? {
    icon: '•',
    verb: action.toLowerCase().replace(/_/g, ' '),
    tone: '#708aa6',
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
