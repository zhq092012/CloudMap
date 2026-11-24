<template>
  <CloudBrainSectionShell
    title="云脑指挥交互终端"
    icon="💬"
    :default-expanded="defaultExpanded"
  >
    <div class="terminal-panel">
      <div class="terminal-messages custom-scrollbar">
        <div
          v-if="osintAgentStatus !== 'ready'"
          class="status-banner"
        >
          <span v-if="osintAgentStatus === 'loading'" class="text-[#9ca3af]">正在连接开源情报分析师...</span>
          <span v-else-if="osintAgentStatus === 'not-found'" class="text-amber-400/90">
            未找到「开源情报分析师」Agent，请先在智能体中心创建。
          </span>
          <span v-else-if="osintAgentStatus === 'error'" class="text-rose-400/90">
            连接失败：{{ osintAgentError }}
          </span>
        </div>

        <div v-if="messages.length === 0" class="empty-state">
          <div
            class="w-12 h-12 rounded-full bg-[#1b2637] border border-[#2d3a4d]/60 flex items-center justify-center mb-2 text-[#6b7280]"
          >
            <svg class="w-6 h-6 text-[#9ca3af] opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <p class="hint">
            通过自然语言及多模态信息输入，调度多领域专家 Agent，进行网阅、分析、研判、指令的协同指挥。
          </p>
          <div class="prompt-list">
            <button
              v-for="prompt in recommendedPrompts"
              :key="prompt"
              type="button"
              class="prompt-item"
              @click="selectPrompt(prompt)"
            >
              <span class="text-[#3b82f6]">•</span> {{ prompt }}
            </button>
          </div>
        </div>

        <div v-else class="message-list">
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            class="message-row"
            :class="msg.sender === 'user' ? 'message-row--user' : 'message-row--assistant'"
          >
            <div class="message-meta">
              {{ msg.sender === "user" ? "您" : "开源情报分析师" }} ({{ msg.timestamp }})
            </div>
            <div class="message-bubble" :class="msg.sender === 'user' ? 'message-bubble--user' : 'message-bubble--assistant'">
              <div v-if="msg.sender === 'user'" class="whitespace-pre-wrap">{{ msg.content }}</div>
              <div
                v-else
                class="markdown-body"
                v-html="renderMarkdown(msg.content || (msg.pending ? '思考中…' : ''))"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="terminal-input-wrap">
        <div class="terminal-input-bar">
          <input
            v-model="chatInput"
            type="text"
            :disabled="isStreaming || osintAgentStatus !== 'ready'"
            :placeholder="isStreaming ? '开源情报分析师思考中…' : '请输入您想了解的问题'"
            class="terminal-input"
            @keyup.enter="handleSend"
          />
          <div class="input-actions">
            <button type="button" class="icon-btn" aria-label="附加链接">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </button>
            <button
              type="button"
              class="send-btn"
              :class="{ 'send-btn--active': chatInput.trim() && !isStreaming && osintAgentStatus === 'ready' }"
              :disabled="!chatInput.trim() || isStreaming || osintAgentStatus !== 'ready'"
              aria-label="发送"
              @click="handleSend"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </CloudBrainSectionShell>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import MarkdownIt from "markdown-it";
import { ElMessage } from "element-plus";
import CloudBrainSectionShell from "./CloudBrainSectionShell.vue";
import { listAgents, stream, currentSession, turns } from "@/agents-hub/api";
import type { ChatEvent } from "@/agents-hub/types";

withDefaults(
  defineProps<{
    /** 区块初始是否展开 */
    defaultExpanded?: boolean;
  }>(),
  { defaultExpanded: true },
);

/** 开源情报分析师 Agent 显示名 */
const OSINT_AGENT_NAME = "开源情报分析师";
/** 会话 key 本地存储键 */
const SESSION_STORAGE_KEY = "cloudmap_osint_session";

/** Markdown 渲染：禁用原始 HTML，降低 XSS 风险 */
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

/**
 * 将助手回复 Markdown 转为 HTML。
 * @param src - 原始文本
 */
const renderMarkdown = (src: string) => md.render(src || "");

const chatInput = ref("");
const isStreaming = ref(false);
const osintAgentId = ref<string | null>(null);
const osintAgentStatus = ref<"loading" | "ready" | "not-found" | "error">("loading");
const osintAgentError = ref("");
const sessionKey = ref<string | null>(null);

/** 空态推荐问题 */
const recommendedPrompts = ref([
  "对比上周的防空部署变化",
  "伊朗防空体系最大薄弱点在哪",
  "纳坦兹防空升级的可能意图是什么",
]);

/** 单条聊天消息 */
interface ChatMessage {
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
  pending?: boolean;
}

const messages = ref<ChatMessage[]>([]);

/**
 * 格式化为 HH:mm:ss。
 */
const formatTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
};

/**
 * 持久化 sessionKey 至 localStorage。
 * @param key - 会话标识，null 表示清除
 */
function persistSessionKey(key: string | null) {
  try {
    if (key) localStorage.setItem(SESSION_STORAGE_KEY, key);
    else localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* ignore quota */
  }
}

/** 解析并连接开源情报分析师 Agent */
async function resolveOsintAgent() {
  osintAgentStatus.value = "loading";
  osintAgentError.value = "";
  try {
    const agents = await listAgents();
    const agent = agents.find(
      (a) => a.name === OSINT_AGENT_NAME || a.name?.includes(OSINT_AGENT_NAME),
    );
    if (!agent?.id) {
      osintAgentStatus.value = "not-found";
      return;
    }
    osintAgentId.value = agent.id;
    osintAgentStatus.value = "ready";

    try {
      const sess = await currentSession(agent.id);
      sessionKey.value = sess.sessionKey || localStorage.getItem(SESSION_STORAGE_KEY) || null;
      if (sessionKey.value && sess.exists) {
        const list = await turns(agent.id, sessionKey.value);
        messages.value = list
          .filter((t) => t.role === "USER" || t.role === "ASSISTANT")
          .map((t) => ({
            sender: t.role === "USER" ? "user" : "assistant",
            content: t.content || "",
            timestamp: formatTime(),
          }));
      }
    } catch {
      sessionKey.value = null;
    }
  } catch (e: unknown) {
    osintAgentStatus.value = "error";
    osintAgentError.value = e instanceof Error ? e.message : String(e);
  }
}

onMounted(() => {
  void resolveOsintAgent();
});

/**
 * 点击推荐问题并发送。
 * @param prompt - 问题文案
 */
const selectPrompt = (prompt: string) => {
  chatInput.value = prompt;
  void handleSend();
};

/** 发送用户问题并流式接收回复 */
const handleSend = async () => {
  const query = chatInput.value.trim();
  if (!query) return;

  if (!osintAgentId.value) {
    ElMessage.warning("开源情报分析师 Agent 尚未就绪，请稍后重试");
    return;
  }

  const now = formatTime();
  messages.value.push({
    sender: "user",
    content: query,
    timestamp: now,
  });
  chatInput.value = "";

  const replyMsg: ChatMessage = {
    sender: "assistant",
    content: "",
    timestamp: now,
    pending: true,
  };
  messages.value.push(replyMsg);
  isStreaming.value = true;

  try {
    for await (const evt of stream(osintAgentId.value, {
      message: query,
      sessionKey: sessionKey.value ?? undefined,
    })) {
      handleChatEvent(evt, replyMsg);
    }
  } catch (e: unknown) {
    replyMsg.pending = false;
    replyMsg.content += `\n[请求失败] ${e instanceof Error ? e.message : String(e)}`;
    isStreaming.value = false;
  }
};

/**
 * 处理 Agent SSE 事件。
 * @param evt - 流式事件
 * @param replyMsg - 当前助手消息对象（就地更新）
 */
function handleChatEvent(evt: ChatEvent, replyMsg: ChatMessage) {
  switch (evt.type) {
    case "processing":
      replyMsg.content = `⏳ 联系分析师中...${evt.message || ""}`;
      break;
    case "token":
      replyMsg.content += evt.data || "";
      break;
    case "tool_call":
      replyMsg.content += `\n[调用工具] ${evt.toolName || "tool"}`;
      break;
    case "tool_result":
      replyMsg.content += `\n[工具结果] ${evt.toolResult || ""}`;
      break;
    case "done":
      replyMsg.pending = false;
      isStreaming.value = false;
      if (evt.sessionKey) {
        sessionKey.value = evt.sessionKey;
        persistSessionKey(evt.sessionKey);
      }
      break;
    case "error":
      replyMsg.pending = false;
      replyMsg.content += `\n[错误] ${evt.error || "unknown"}`;
      isStreaming.value = false;
      break;
    default:
      break;
  }
}
</script>

<style scoped>
.terminal-panel {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  min-height: 260px;
  max-height: min(42vh, 380px);
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 6px;
  overflow: hidden;
}

.terminal-messages {
  flex: 1 1 auto;
  min-height: 160px;
  overflow-y: auto;
  padding: 12px;
}

.status-banner {
  text-align: center;
  font-size: 11.5px;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #2d3a4d50;
  background: rgba(26, 35, 50, 0.5);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.hint {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.5;
  max-width: 18rem;
  margin: 0 0 12px;
}

.prompt-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.prompt-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  font-size: 12px;
  color: #cbd5e1;
  background: #1a2332;
  border: 1px solid #2d3a4d70;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.prompt-item:hover {
  background: #253141;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-row {
  display: flex;
  flex-direction: column;
  max-width: 92%;
}

.message-row--user {
  margin-left: auto;
  align-items: flex-end;
}

.message-row--assistant {
  margin-right: auto;
  align-items: flex-start;
}

.message-meta {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
  font-family: ui-monospace, monospace;
}

.message-bubble {
  padding: 8px 10px;
  font-size: 12.5px;
  line-height: 1.5;
  border-radius: 6px;
  border: 1px solid #2d3a4d;
}

.message-bubble--user {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.35);
  color: #dbeafe;
  border-top-right-radius: 2px;
}

.message-bubble--assistant {
  background: #1a2332;
  color: #e5e7eb;
  border-top-left-radius: 2px;
}

.terminal-input-wrap {
  flex-shrink: 0;
  padding: 8px 10px;
  background: #1a2332;
  border-top: 1px solid #2d3a4d40;
}

.terminal-input-bar {
  position: relative;
  display: flex;
  align-items: center;
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 6px;
  padding: 6px 10px;
  transition: border-color 0.15s ease;
}

.terminal-input-bar:focus-within {
  border-color: rgba(59, 130, 246, 0.6);
}

.terminal-input {
  width: 100%;
  padding-right: 56px;
  font-size: 12.5px;
  color: #e5e7eb;
  background: transparent;
  border: none;
  outline: none;
}

.terminal-input::placeholder {
  color: #6b7280;
}

.terminal-input:disabled {
  opacity: 0.6;
}

.input-actions {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-btn {
  padding: 2px;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
}

.icon-btn:hover {
  color: #cbd5e1;
}

.send-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: none;
  background: #1e293b;
  color: #6b7280;
  cursor: not-allowed;
}

.send-btn--active {
  background: #3b82f6;
  color: #fff;
  cursor: pointer;
}

.send-btn--active:hover {
  background: #2563eb;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #2d3a4d;
  border-radius: 3px;
}

.markdown-body {
  font-size: 12.5px;
  line-height: 1.75;
  color: #cbd5e1;
  word-break: break-word;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  font-weight: 700;
  margin: 6px 0 4px;
  color: #93c5fd;
}

.markdown-body :deep(p) {
  margin: 4px 0;
}

.markdown-body :deep(strong) {
  color: #bfdbfe;
}

.markdown-body :deep(code) {
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 11px;
  color: #fca5a5;
}

.markdown-body :deep(pre) {
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 4px;
  padding: 8px;
  overflow-x: auto;
}
</style>