<template>
  <div class="cp-page">
    <!-- header -->
    <div class="cp-head">
      <span class="cp-head-label">会话</span>
      <span v-if="sessionKey" class="cp-session-chip is-live" :title="sessionKey"
        >{{ sessionKey.slice(0, 24) }}{{ sessionKey.length > 24 ? '…' : '' }}</span>
      <span v-else-if="restoring" class="cp-session-chip is-idle">解析中…</span>
      <span v-else class="cp-session-chip is-idle">新会话 · 发送开始</span>
      <span class="cp-grow"></span>
      <button class="cp-ghost" @click="goSessions">📋 全部会话</button>
      <button class="cp-ghost" :disabled="busy" @click="handleNewChat">✨ 新对话</button>
    </div>

    <!-- thread -->
    <div ref="threadRef" class="cp-thread">
      <div v-if="restoring && messages.length === 0" class="cp-placeholder">加载对话中…</div>
      <div v-else-if="!restoring && messages.length === 0" class="cp-placeholder">
        开始新对话。试试 <code>/reset</code> 清除会话。
      </div>

      <div v-for="m in messages" :key="m.id" class="cp-msg" :class="`is-${m.role}`">
        <div v-if="m.tools.length" class="cp-tools">
          <ToolCallBlock v-for="t in m.tools" :key="t.id" :tool-name="t.name" :tool-call-id="t.id" :result="t.result" />
        </div>
        <span v-if="m.text">{{ m.text }}</span>
        <span v-else-if="m.pending" class="cp-pending">…</span>
      </div>
    </div>

    <!-- composer -->
    <div class="cp-composer">
      <textarea ref="inputRef" v-model="input" rows="1" :disabled="restoring"
        :placeholder="restoring ? '加载中…' : `给 ${agentId} 发消息…`" class="cp-input"
        @keydown="handleKeyDown"></textarea>
      <button :disabled="!canSend" class="cp-send" @click="handleSend">
        {{ busy ? '…' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import ToolCallBlock from './ToolCallBlock.vue';
import { currentSession, stream } from './api';
import { turns as fetchTurns } from './api';
import type { TurnEntry } from './types';

const props = defineProps<{ agentId: string }>();
const router = useRouter();

type Role = 'user' | 'assistant' | 'system';
interface ToolEntry { id: string; name: string; input?: string; result?: string; }
interface Message { id: string; role: Role; text: string; tools: ToolEntry[]; pending?: boolean; }

let counter = 0;
const nextId = () => `m${Date.now().toString(36)}-${counter++}`;
const STORAGE_PREFIX = 'claw_chat_session:';
const storageKey = (id: string) => `${STORAGE_PREFIX}${id}`;

function turnsToMessages(turns: TurnEntry[]): Message[] {
  const out: Message[] = [];
  for (const t of turns) {
    const role = String(t.role).toUpperCase();
    if (role === 'USER') {
      out.push({ id: t.id, role: 'user', text: t.content ?? '', tools: [] });
    } else if (role === 'ASSISTANT') {
      out.push({ id: t.id, role: 'assistant', text: t.content ?? '', tools: [] });
    } else if (role === 'TOOL') {
      const last = out.length > 0 ? out[out.length - 1] : null;
      const tool: ToolEntry = { id: t.id, name: t.toolName ?? 'tool', input: t.toolInput ?? undefined, result: t.toolResult ?? undefined };
      if (last && last.role === 'assistant') last.tools = [...last.tools, tool];
      else out.push({ id: `${t.id}-host`, role: 'assistant', text: '', tools: [tool] });
    }
  }
  return out;
}

const messages = ref<Message[]>([]);
const input = ref('');
const busy = ref(false);
const restoring = ref(true);
const sessionKey = ref<string | null>(null);
const threadRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLTextAreaElement | null>(null);

// allow parent (AgentLayout) to supply the resolved agent id
const injectedId = inject<string | undefined>('agentHubId', undefined);
const agentId = computed(() => props.agentId || injectedId || '');

const canSend = computed(() => !busy.value && !restoring.value && input.value.trim().length > 0);

function persistSession(key: string | null) {
  try {
    if (key) localStorage.setItem(storageKey(agentId.value), key);
    else localStorage.removeItem(storageKey(agentId.value));
  } catch { /* ignore quota */ }
}

watch(agentId, () => { void run() }, { immediate: true });

async function run() {
  messages.value = [];
  input.value = '';
  restoring.value = true;

  const urlKey = new URLSearchParams(window.location.search).get('session');
  let stored: string | null = null;
  try { stored = localStorage.getItem(storageKey(agentId.value)); } catch { /* ignore */ }
  const initialKey = urlKey || stored || null;

  let key: string | null = initialKey;
  let exists = false;
  try {
    if (!key) {
      const cur = await currentSession(agentId.value);
      key = cur.sessionKey;
      exists = cur.exists;
    } else {
      const cur = await currentSession(agentId.value);
      exists = cur.exists && cur.sessionKey === key;
    }
  } catch { /* tolerate */ }

  sessionKey.value = key;
  if (key && exists) {
    try {
      const list = await fetchTurns(agentId.value, key);
      messages.value = turnsToMessages(list);
    } catch { /* empty */ }
  }
  restoring.value = false;
  if (key && key !== urlKey) {
    const next = new URLSearchParams(window.location.search);
    next.set('session', key);
    const qs = next.toString();
    const url = `${window.location.pathname}?${qs}${window.location.hash}`;
    window.history.replaceState(null, '', url);
  }
}

watch(messages, async () => {
  await nextTick();
  threadRef.value?.scrollTo({ top: threadRef.value.scrollHeight });
}, { deep: true });

// ---- 打字机式增量回显 ----
// 后端当前把整段回复作为单个 token 事件一次性下发（见 agentbuilder ChatController.stream：
// "the full reply text (currently emitted as a single chunk)"），前端拿不到逐字流，
// 因此在此把收到的整段文本模拟为逐字显示，呈现"打字"效果。
// 若后端将来改为逐 token 下发，本逻辑同样兼容：每个 chunk 追加到 typerFull 并继续揭示。
const typerTimer = ref<number | null>(null);
const typerFull = ref('');
const typerShown = ref(0);
const typerId = ref<string | null>(null);

function stopTyper() {
  if (typerTimer.value != null) {
    clearInterval(typerTimer.value);
    typerTimer.value = null;
  }
}
function setReplyText(id: string, text: string) {
  messages.value = messages.value.map((m) => (m.id === id ? { ...m, text } : m));
}
function ensureTyper(id: string) {
  typerId.value = id;
  if (typerTimer.value != null) return;
  typerTimer.value = window.setInterval(() => {
    if (typerShown.value >= typerFull.value.length) {
      stopTyper();
      return;
    }
    typerShown.value = Math.min(typerFull.value.length, typerShown.value + 2);
    setReplyText(typerId.value!, typerFull.value.slice(0, typerShown.value));
  }, 18);
}
function resetTyper() {
  stopTyper();
  typerFull.value = '';
  typerShown.value = 0;
  typerId.value = null;
}

async function handleSend() {
  if (!canSend.value) return;
  resetTyper();
  const text = input.value.trim();
  input.value = '';
  busy.value = true;
  const userMsg: Message = { id: nextId(), role: 'user', text, tools: [] };
  const replyMsg: Message = { id: nextId(), role: 'assistant', text: '', tools: [], pending: true };
  messages.value = [...messages.value, userMsg, replyMsg];

  try {
    for await (const evt of stream(agentId.value, { message: text, sessionKey: sessionKey.value ?? undefined })) {
      if (evt.type === 'processing') {
        setReplyText(replyMsg.id, `⏳ 正在处理中...`);
      } else if (evt.type === 'token') {
        typerFull.value += evt.data ?? '';
        ensureTyper(replyMsg.id);
      } else if (evt.type === 'tool_call') {
        const entry: ToolEntry = {
          id: `${evt.toolName ?? 'tool'}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: evt.toolName ?? 'tool',
          input: evt.toolInput,
        };
        messages.value = messages.value.map((m) => (m.id === replyMsg.id ? { ...m, tools: [...m.tools, entry] } : m));
      } else if (evt.type === 'tool_result') {
        messages.value = messages.value.map((m) => {
          if (m.id !== replyMsg.id) return m;
          const tools = [...m.tools];
          for (let i = tools.length - 1; i >= 0; i--) {
            if (tools[i].name === evt.toolName && !tools[i].result) {
              tools[i] = { ...tools[i], result: evt.toolResult };
              return { ...m, tools };
            }
          }
          tools.push({ id: `${evt.toolName ?? 'tool'}-${Date.now()}`, name: evt.toolName ?? 'tool', result: evt.toolResult });
          return { ...m, tools };
        });
      } else if (evt.type === 'done') {
        if (evt.sessionKey) {
          sessionKey.value = evt.sessionKey;
          persistSession(evt.sessionKey);
          const next = new URLSearchParams(window.location.search);
          if (next.get('session') !== evt.sessionKey) {
            next.set('session', evt.sessionKey);
            const qs = next.toString();
            window.history.replaceState(null, '', `${window.location.pathname}?${qs}${window.location.hash}`);
          }
        }
        messages.value = messages.value.map((m) => (m.id === replyMsg.id ? { ...m, pending: false } : m));
      } else if (evt.type === 'error') {
        stopTyper();
        const errText = `[error] ${evt.error ?? 'unknown'}`;
        messages.value = messages.value.map((m) => (m.id === replyMsg.id
          ? { ...m, pending: false, text: typerFull.value + (typerFull.value ? '\n' : '') + errText }
          : m));
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'stream failed';
    messages.value = messages.value.map((m) => (m.id === replyMsg.id
      ? { ...m, pending: false, text: m.text + (m.text ? '\n' : '') + `[error] ${msg}` }
      : m));
  } finally {
    busy.value = false;
    inputRef.value?.focus();
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

function handleNewChat() {
  if (busy.value) return;
  resetTyper();
  if (messages.value.length > 0 && !confirm('开始新对话？当前线程将被清空（会向智能体发送 /reset）。')) return;
  messages.value = [{ id: nextId(), role: 'system', text: '已开启新对话，之前的回合已清空。', tools: [] }];
  (async () => {
    try {
      for await (const _ of stream(agentId.value, { message: '/reset', sessionKey: sessionKey.value ?? undefined })) { /* drain */ }
    } catch { /* best-effort */ }
  })();
}

function goSessions() {
  router.push(`/agents-hub/agent/${encodeURIComponent(agentId.value)}/sessions`);
}

onMounted(() => { inputRef.value?.focus(); });
onBeforeUnmount(() => { stopTyper(); });
</script>

<style scoped lang="scss">
@use "./styles/tokens" as *;

.cp-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: $bg-root;
}

/* ---- 顶部会话条 ---- */
.cp-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 26px;
  border-bottom: 1px solid $border;
  background: $bg-sunken;
}

.cp-head-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: $text-4;
}

.cp-session-chip {
  padding: 2px 9px;
  border-radius: $radius-sm;
  border: 1px solid $border;
  background: $bg-panel;
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.7;

  &.is-live {
    border-color: $accent-line;
    background: $accent-soft;
    color: $accent-text;
  }

  &.is-idle {
    color: $text-4;
  }
}

.cp-grow {
  flex: 1;
}

.cp-ghost {
  height: 28px;
  padding: 0 12px;
  border-radius: $radius-md;
  border: 1px solid $border;
  background: $bg-panel;
  color: $text-2;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: color $ease, border-color $ease, background $ease;

  &:hover:not(:disabled) {
    color: $accent-text;
    border-color: $accent-line;
    background: $accent-soft;
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
}

/* ---- 消息流 ---- */
.cp-thread {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  padding: 24px 32px 28px;
  @include thin-scroll;
}

.cp-placeholder {
  margin-top: 96px;
  text-align: center;
  font-size: 12.5px;
  color: $text-3;

  code {
    padding: 1px 6px;
    border-radius: $radius-sm;
    border: 1px solid $accent-line;
    background: $bg-panel;
    color: $accent-text;
    font-size: 11.5px;
  }
}

.cp-msg {
  max-width: 78%;
  padding: 12px 15px;
  border-radius: $radius-lg;
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;

  &.is-user {
    align-self: flex-end;
    border: 1px solid $accent-line;
    color: #fff;
    @include accent-gradient;
    box-shadow: 0 2px 10px rgba(59, 130, 246, 0.28);
  }

  &.is-assistant {
    align-self: flex-start;
    border: 1px solid $border;
    background: $bg-panel;
    color: $text-2;
  }

  &.is-system {
    align-self: center;
    border: 1px dashed $border;
    background: transparent;
    color: $text-4;
    font-size: 11.5px;
    font-style: italic;
  }
}

.cp-tools {
  margin-bottom: 10px;
}

.cp-pending {
  color: $text-4;
}

/* ---- 输入区 ---- */
.cp-composer {
  flex: none;
  display: flex;
  gap: 10px;
  padding: 14px 26px;
  border-top: 1px solid $border;
  background: $bg-sunken;
}

.cp-input {
  flex: 1;
  min-height: 48px;
  max-height: 200px;
  padding: 12px 14px;
  border-radius: $radius-md;
  border: 1px solid $border;
  background: $bg-root;
  color: $text;
  font-size: 12.5px;
  line-height: 1.7;
  resize: none;
  outline: none;
  transition: border-color $ease, box-shadow $ease;

  &::placeholder {
    color: $text-4;
  }

  &:focus {
    border-color: $accent-line;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12);
  }

  &:disabled {
    opacity: 0.6;
  }
}

.cp-send {
  align-self: flex-end;
  height: 44px;
  padding: 0 22px;
  border: 1px solid transparent;
  border-radius: $radius-md;
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  @include accent-gradient;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  transition: box-shadow $ease, opacity $ease;

  &:hover:not(:disabled) {
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.42);
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
    box-shadow: none;
  }
}
</style>
