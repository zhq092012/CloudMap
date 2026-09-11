<template>
  <div class="h-full flex flex-col min-h-0 bg-[#060c14]">
    <!-- header -->
    <div class="flex items-center gap-2.5 px-7 py-2.5 border-b border-[#1a2b42] bg-[#0b131f] text-xs text-[#708aa6] flex-shrink-0">
      <span>会话</span>
      <span v-if="sessionKey" class="font-mono px-2 py-0.5 rounded bg-[#0f1927] text-[#7fd4ff] border border-[#1d3a57]"
        :title="sessionKey">{{ sessionKey.slice(0, 24) }}{{ sessionKey.length > 24 ? '…' : '' }}</span>
      <span v-else-if="restoring" class="font-mono px-2 py-0.5 rounded bg-[#0f1927] text-[#526e8c] opacity-60">解析中…</span>
      <span v-else class="font-mono px-2 py-0.5 rounded bg-[#0f1927] text-[#526e8c] opacity-60">新会话 — 发送开始</span>
      <span class="flex-1"></span>
      <button class="px-3 py-1 rounded-lg border border-[#1e324f] text-[#a3b8cc] hover:text-white hover:border-[#2b5384] transition-colors"
        @click="goSessions">📋 全部会话</button>
      <button class="px-3 py-1 rounded-lg border border-[#1e324f] text-[#a3b8cc] hover:text-white hover:border-[#2b5384] transition-colors disabled:opacity-60"
        :disabled="busy" @click="handleNewChat">✨ 新对话</button>
    </div>

    <!-- thread -->
    <div ref="threadRef" class="flex-1 overflow-y-auto custom-scrollbar px-9 py-7 flex flex-col gap-4">
      <div v-if="restoring && messages.length === 0" class="text-[#526e8c] text-sm text-center mt-24">加载对话中…</div>
      <div v-else-if="!restoring && messages.length === 0" class="text-[#526e8c] text-sm text-center mt-24">
        开始新对话。试试 <code class="px-1.5 py-0.5 rounded bg-[#0f1927] text-[#00f3ff] text-xs">/reset</code> 清除会话。
      </div>

      <div v-for="m in messages" :key="m.id"
        class="max-w-[78%] px-4 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words"
        :class="m.role === 'user'
          ? 'self-end text-white'
          : m.role === 'system'
            ? 'self-center text-[#526e8c] italic text-xs'
            : 'self-start bg-[#0f1927] text-[#a3b8cc] border border-[#1e324f]'"
        :style="m.role === 'user' ? { background: 'linear-gradient(135deg,#00f3ff 0%,#3b82f6 100%)', boxShadow: '0 2px 6px rgba(0,243,255,0.25)' } : {}">
        <div v-if="m.tools.length" class="mb-2.5">
          <ToolCallBlock v-for="t in m.tools" :key="t.id" :tool-name="t.name" :tool-call-id="t.id" :result="t.result" />
        </div>
        <span v-if="m.text">{{ m.text }}</span>
        <span v-else-if="m.pending" class="text-[#526e8c]">…</span>
      </div>
    </div>

    <!-- composer -->
    <div class="flex gap-3 px-7 py-4 border-t border-[#1a2b42] bg-[#0b131f]">
      <textarea ref="inputRef" v-model="input" rows="1" :disabled="restoring" :placeholder="restoring ? '加载中…' : `给 ${agentId} 发消息…`"
        class="flex-1 px-4 py-3 rounded-xl bg-[#0c1624] border border-[#203554] text-white placeholder-[#526e8c] focus:outline-none focus:border-[#00f3ff]/60 text-sm resize-none min-h-[48px] max-h-[200px] leading-relaxed"
        @keydown="handleKeyDown" />
      <button :disabled="!canSend"
        class="px-6 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-60 self-end"
        style="background: linear-gradient(135deg,#00f3ff 0%,#3b82f6 100%); box-shadow: 0 2px 6px rgba(0,243,255,0.35);"
        @click="handleSend">
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
