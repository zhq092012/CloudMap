<template>
  <div
    class="w-95 h-full absolute right-0 top-0 z-1000 bg-[#111827]/95 border-l border-[#2d3a4d] text-[#e5e7eb] flex flex-col font-sans select-none backdrop-blur-sm overflow-hidden">
    <!-- 标题 -->
    <div class="shrink-0 px-2.5 pt-2.5 pb-2 border-b border-[#2d3a4d]">
      <h2 class="text-[13.5px] font-bold tracking-wider text-[#e5e7eb] flex items-center gap-1.5">
        🧠 云脑智能面板
      </h2>
    </div>

    <!-- 云脑智能态势分析：高度 = 面板 45% + 50px；报告正文在卡片内部滚动，
         「查看详细报告及分析研判过程」按钮固定在卡片底部常驻可见 -->
    <div class="rp-analysis min-h-0 p-2.5 pb-0 flex flex-col"
      :class="{ 'rp-analysis--fill': terminalCollapsed }">
      <div class="bg-[#1a2332] border border-[#2d3a4d] rounded p-2.5 flex flex-col gap-2 flex-1 min-h-0">
        <div class="flex items-center justify-between text-[12.5px] shrink-0">
          <span class="text-[#93c5fd] font-semibold">云脑智能态势分析</span>
          <span class="text-[#6b7280] scale-90">24小时内</span>
        </div>

        <div
          class="bg-[#111827] border border-[#2d3a4d]/50 p-2 rounded text-[12.5px] text-[#cbd5e1] leading-relaxed overflow-y-auto custom-scrollbar flex-1 min-h-0">
          <div class="text-[#93c5fd] font-semibold mb-1 text-[12.5px]">
            态势分析报告
          </div>
          <div v-if="hasBriefing" class="text-[11.5px] text-[#9ca3af] mb-1">
            简报日期：{{ overviewDate }}
          </div>
          <div v-if="hasBriefing" class="overview-body markdown-body" v-html="overviewHtml"></div>
          <div
            v-else
            class="text-[12.5px] text-[#9ca3af] text-center leading-relaxed bg-[#111827]/60 p-2 rounded border border-[#2d3a4d]/40"
          >
            没有全局异常态势分析信息，请点击"查看详细报告及分析研判过程"按钮进行分析
          </div>
        </div>

        <button type="button" class="rp-report-btn shrink-0" @click="showReportDetail">查看详细报告及分析研判过程</button>
      </div>
    </div>

    <!-- 云脑指挥交互终端：可收起；收起后只留底部一条，最右侧显示「点击展开」 -->
    <div class="mt-2.5 flex flex-col border-t border-[#2d3a4d] bg-[#1a2332]"
      :class="terminalCollapsed ? 'shrink-0' : 'flex-1 min-h-0'">
      <div class="shrink-0 px-2.5 flex items-center justify-between"
        :class="terminalCollapsed ? 'py-3.5 cursor-pointer' : 'py-2.5 border-b border-[#2d3a4d]/40'"
        @click="terminalCollapsed = false">
        <div class="text-[12.5px] font-bold text-[#e5e7eb] tracking-wide flex items-center gap-2">
          <span>云脑指挥交互终端</span>
        </div>
        <span v-if="terminalCollapsed" class="text-[12px] text-[#93c5fd] hover:text-[#bfdbfe] transition-colors">
          点击展开 ⌃
        </span>
        <button v-else type="button" class="rp-collapse-btn" @click.stop="terminalCollapsed = true">
          收起 ⌄
        </button>
      </div>

      <template v-if="!terminalCollapsed">
        <div class="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-[#111827]/40 custom-scrollbar">
        <div v-if="osintAgentStatus !== 'ready'" class="text-[11.5px] text-center py-2 rounded border border-[#2d3a4d]/50 bg-[#1a2332]/50">
          <span v-if="osintAgentStatus === 'loading'" class="text-[#9ca3af]">正在连接开源情报分析师...</span>
          <span v-else-if="osintAgentStatus === 'not-found'" class="text-amber-400/90">未找到“开源情报分析师”Agent，请先在智能体中心创建。</span>
          <span v-else-if="osintAgentStatus === 'error'" class="text-rose-400/90">连接失败：{{ osintAgentError }}</span>
        </div>

        <div v-if="messages.length === 0" class="space-y-5">
          <div class="flex flex-col items-center text-center py-2">
            <div
              class="w-14 h-14 rounded-full bg-[#1b2637] border border-[#2d3a4d]/60 flex items-center justify-center mb-3 text-[#6b7280]">
              <svg class="w-7 h-7 text-[#9ca3af] opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div
              class="bg-[#1a2332]/80 border border-[#2d3a4d]/60 p-2.5 rounded text-[12.5px] text-[#9ca3af] leading-relaxed max-w-xs mx-auto">
              通过自然语言及多模态信息输入，调度多领域专家Agent，可以进行网阅、分析、研判、指令的协同指挥终端
            </div>
          </div>

          <div class="space-y-1.5 px-2">
            <div v-for="prompt in recommendedPrompts" :key="prompt" @click="selectPrompt(prompt)"
              class="bg-[#1a2332] hover:bg-[#253141] border border-[#2d3a4d]/70 px-3 py-2 rounded text-[12.5px] text-[#cbd5e1] cursor-pointer transition-colors flex items-center gap-2">
              <span class="text-[#3b82f6]">•</span> {{ prompt }}
            </div>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div v-for="(msg, idx) in messages" :key="idx" :class="[
            'flex flex-col max-w-[90%]',
            msg.sender === 'user'
              ? 'ml-auto items-end'
              : 'mr-auto items-start',
          ]">
            <div :class="[
              'text-[12.5px] text-[#6b7280] mb-1 font-mono',
              msg.sender === 'user' ? 'text-right' : 'text-left',
            ]">
              {{ msg.sender === "user" ? "您" : "开源情报分析师" }} ({{
                msg.timestamp
              }})
            </div>
            <div :class="[
              'p-2.5 rounded text-[12.5px] leading-relaxed border',
              msg.sender === 'user'
                ? 'bg-[rgba(59,130,246,0.12)] border-[rgba(59,130,246,0.35)] text-[#dbeafe] rounded-tr-none'
                : 'bg-[#1a2332] border-[#2d3a4d] text-[#e5e7eb] rounded-tl-none',
            ]">
              <div v-if="msg.sender === 'user'" style="white-space: pre-wrap">{{ msg.content }}</div>
              <div v-else class="markdown-body" v-html="renderMarkdown(msg.content || (msg.pending ? '思考中…' : ''))"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="shrink-0 p-2.5 bg-[#1a2332]">
        <div
          class="relative flex items-center bg-[#111827] border border-[#2d3a4d] rounded px-3 py-1.5 focus-within:border-[#3b82f6]/60 transition-colors">
          <input v-model="chatInput" type="text" :disabled="isStreaming || osintAgentStatus !== 'ready'"
            :placeholder="isStreaming ? '开源情报分析师思考中…' : '请输入您想了解的问题'"
            class="w-full bg-transparent text-[12.5px] text-[#e5e7eb] placeholder-[#6b7280] focus:outline-none pr-16 disabled:opacity-60"
            @keyup.enter="handleSend" />
          <div class="absolute right-2 flex items-center gap-2">
            <button class="text-[#6b7280] hover:text-[#cbd5e1] transition-colors p-0.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
            <button @click="handleSend" class="w-5 h-5 rounded-full flex items-center justify-center transition-colors"
              :class="chatInput.trim() && !isStreaming && osintAgentStatus === 'ready'
                ? 'bg-[#3b82f6] hover:bg-[#2563eb] text-white'
                : 'bg-slate-800 text-[#6b7280] cursor-not-allowed'
                ">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      </template>
    </div>

    <el-dialog
      v-model="briefingDialogVisible"
      plain
      width="960px"
      append-to-body
      :close-on-click-modal="false"
      title="态势监控简报详情"
    >
      <BriefingDialog
        heading="态势监控简报"
        :state="briefingState"
        :briefing="briefingData"
        :error="briefingError"
        @regenerate="doGenerateBriefing"
        @close="briefingDialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import MarkdownIt from "markdown-it";
import { ElMessage } from "element-plus";
import BriefingDialog from "@/components/Dialogs/BriefingDialog.vue";
import { useBriefing } from "@/composables/useBriefing";
import { listAgents, stream, currentSession, turns } from "@/agents-hub/api";
import type { ChatEvent } from "@/agents-hub/types";

// Markdown 渲染器：禁用原始 HTML（防 XSS），自动链接，单换行转 <br>
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });
const renderMarkdown = (src: string) => md.render(src || "");

const {
  briefingDialogVisible,
  briefingState,
  briefingData,
  briefingError,
  overviewHtml,
  overviewDate,
  hasBriefing,
  showReportDetail,
  doGenerateBriefing,
} = useBriefing();
const capabilityData = ref([
  { name: "指挥控制", irVal: 82, usVal: 91 },
  { name: "火力打击", irVal: 78, usVal: 88 },
  { name: "防空反导", irVal: 65, usVal: 92 },
  { name: "海上封锁", irVal: 85, usVal: 75 },
  { name: "情报侦察", irVal: 60, usVal: 90 },
  { name: "后勤保障", irVal: 55, usVal: 85 },
]);

const buttons = ref([
  { id: "analysis", text: "查看研判分析" },
  { id: "export", text: "导出分析报告" },
  { id: "history", text: "历史能力变化" },
]);
const handleBtnClick = (btn: { id: string; text: string }) => {
  switch (btn.id) {
    case "analysis":
      alert("查看研判分析功能待开发");
      break;
    case "export":
      alert("导出分析报告功能待开发");
      break;
    case "history":
      alert("历史能力变化功能待开发");
      break;
  }
};

// ---- 云脑指挥交互终端：接入“开源情报分析师” Agent ----
const OSINT_AGENT_NAME = "开源情报分析师";
const SESSION_STORAGE_KEY = "cloudmap_osint_session";

const chatInput = ref("");
const isStreaming = ref(false);
const osintAgentId = ref<string | null>(null);
const osintAgentStatus = ref<"loading" | "ready" | "not-found" | "error">("loading");
const osintAgentError = ref("");
const sessionKey = ref<string | null>(null);

const recommendedPrompts = ref([
  "对比上周的防空部署变化",
  "伊朗防空体系最大薄弱点在哪",
  "纳坦兹防空升级的可能意图是什么",
]);

interface ChatMessage {
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
  pending?: boolean;
}

const messages = ref<ChatMessage[]>([]);

// 云脑指挥交互终端折叠态：收起后只保留底部标题条（右侧显示「点击展开」）
const terminalCollapsed = ref(false);

const formatTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
};

function persistSessionKey(key: string | null) {
  try {
    if (key) localStorage.setItem(SESSION_STORAGE_KEY, key);
    else localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch { /* ignore quota */ }
}

async function resolveOsintAgent() {
  osintAgentStatus.value = "loading";
  osintAgentError.value = "";
  try {
    const agents = await listAgents();
    const agent = agents.find(
      (a) => a.name === OSINT_AGENT_NAME || a.name?.includes(OSINT_AGENT_NAME)
    );
    if (!agent?.id) {
      osintAgentStatus.value = "not-found";
      return;
    }
    osintAgentId.value = agent.id;
    osintAgentStatus.value = "ready";

    // 尝试恢复当前会话及历史消息
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
    } catch (e) {
      // 无历史或授权失败时静默，允许开启新会话
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

// 选取推荐提示词
const selectPrompt = (prompt: string) => {
  chatInput.value = prompt;
  handleSend();
};

// 发送指令/问题
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

function handleChatEvent(evt: ChatEvent, replyMsg: ChatMessage) {
  switch (evt.type) {
    case "processing":
      replyMsg.content = `⏳ 联系分析师中...${evt.message || ''}`;
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
.overview-body {
  overflow-y: auto;
}

/* 滚动条：与左栏/智能体中心一致 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #2d3a4d;
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #3d4d64;
}

/* 「查看详细报告及分析研判过程」：次按钮（蓝底淡色，同智能体中心的 ghost/pill）
   已从滚动区移到卡片底部常驻，间距交给父级 gap，因此 margin 归零 */
.rp-report-btn {
  margin-top: 0;
  width: 100%;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.rp-report-btn:hover {
  color: #bfdbfe;
  background: rgba(59, 130, 246, 0.22);
  border-color: rgba(59, 130, 246, 0.6);
}

.rp-report-btn:active {
  background: rgba(59, 130, 246, 0.3);
}

/* 云脑智能态势分析：固定高度 = 面板 45% + 50px（比原来多 50px）；
   终端收起时改为填充剩余高度，让收起的终端条始终贴在面板最下方 */
.rp-analysis {
  flex: 0 0 auto;
  height: calc(45% + 50px);
}
.rp-analysis--fill {
  flex: 1 1 auto;
  height: auto;
}

/* 终端标题栏右侧的「收起」按钮 */
.rp-collapse-btn {
  padding: 2px 8px;
  font-size: 11.5px;
  line-height: 1.5;
  color: #9ca3af;
  background: transparent;
  border: 1px solid #2d3a4d;
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.rp-collapse-btn:hover {
  color: #cbd5e1;
  background: #253141;
  border-color: #3d4d64;
}

/* 开源情报分析师回复的 Markdown 暗色主题样式 */
.markdown-body {
  font-size: 12.5px;
  line-height: 1.75;
  color: #cbd5e1;
  word-break: break-word;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-weight: 700;
  margin: 8px 0 4px;
  color: #93c5fd;
  line-height: 1.35;
}
.markdown-body :deep(h1) { font-size: 14px; }
.markdown-body :deep(h2) { font-size: 13px; }
.markdown-body :deep(h3) { font-size: 12px; }
.markdown-body :deep(h4) { font-size: 12px; }
.markdown-body :deep(p) { margin: 4px 0; }
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 18px;
  margin: 4px 0;
}
.markdown-body :deep(li) { margin: 2px 0; }
.markdown-body :deep(ul li) { list-style: disc; }
.markdown-body :deep(ol li) { list-style: decimal; }
.markdown-body :deep(strong) { color: #bfdbfe; font-weight: 700; }
.markdown-body :deep(em) { color: #cbd5e1; }
.markdown-body :deep(a) { color: #93c5fd; text-decoration: underline; }
.markdown-body :deep(code) {
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #fca5a5;
}
.markdown-body :deep(pre) {
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 4px;
  padding: 8px 10px;
  overflow-x: auto;
  margin: 6px 0;
}
.markdown-body :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
  color: #e5e7eb;
  font-size: 11px;
}
.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 6px 0;
  font-size: 11px;
  display: block;
  overflow-x: auto;
}
.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #2d3a4d;
  padding: 3px 7px;
  text-align: left;
}
.markdown-body :deep(th) { background: #1a2332; color: #93c5fd; font-weight: 700; }
.markdown-body :deep(blockquote) {
  border-left: 3px solid #3b82f6;
  padding-left: 8px;
  color: #cbd5e1;
  margin: 6px 0;
}
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #2d3a4d;
  margin: 8px 0;
}
.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 4px;
  margin: 4px 0;
}
</style>
