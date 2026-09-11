<template>
  <div
    class="w-95 h-full absolute right-0 top-0 z-1000 bg-[#111625]/90 border-l border-[#1e293b] text-slate-200 flex flex-col font-sans select-none backdrop-blur-sm overflow-hidden">
    <div class="flex-1 overflow-y-auto p-2.5 space-y-4">
      <div class="border-b border-[#2d3748] pb-2">
        <h2 class="text-sm font-bold tracking-wider text-amber-500 flex items-center gap-1.5">
          🧠 云脑智能面板
        </h2>
      </div>

      <div class="bg-[#161e2e] border border-[#2d3748] rounded p-2.5 flex flex-col gap-2">
        <div class="flex items-center justify-between text-[12px]">
          <span class="text-amber-500 font-semibold">云脑智能态势分析</span>
          <span class="text-slate-500 scale-90">24小时内</span>
        </div>

        <div
          class="bg-[#111625] border border-[#2d3748]/50 p-2 rounded text-[12px] text-slate-300 leading-relaxed overflow-y-auto">
          <div class="text-amber-400/90 font-semibold mb-1 text-[12px]">
            态势分析报告
          </div>
          <div v-if="hasBriefing" class="text-[11px] text-amber-400/80 mb-1">
            简报日期：{{ overviewDate }}
          </div>
          <div v-if="hasBriefing" class="overview-body markdown-body" v-html="overviewHtml"></div>
          <div
            v-else
            class="text-[12px] text-slate-400 text-center leading-relaxed bg-[#0c121f]/60 p-2 rounded border border-[#2d3748]/40"
          >
            没有全局异常态势分析信息，请点击"查看详细报告及分析研判过程"按钮进行分析
          </div>
          <el-button type="info" class="mt-2.5 text-[12px]" @click="showReportDetail">查看详细报告及分析研判过程</el-button>
        </div>
      </div>

      <!--div class="bg-[#161e2e] border border-[#2d3748] rounded p-2.5">
        <div class="text-[14px] font-bold mb-2.5">能力画像对比研判</div>
        <div class="space-y-3">
          <div v-for="item in capabilityData" :key="item.name" class="text-[12px]">
            <div class="flex justify-between text-slate-400 mb-1 px-1">
              <span class="font-mono text-rose-400 font-semibold">伊朗 {{ item.irVal }}%</span>
              <span class="text-slate-200 font-medium">{{ item.name }}</span>
              <span class="font-mono text-sky-400 font-semibold">美以联军 {{ item.usVal }}%</span>
            </div>
            <div class="h-1.5 w-full bg-[#111625] rounded-full flex overflow-hidden">
              <div class="h-full bg-rose-500 rounded-l-full" :style="{
                width: `${(item.irVal / (item.irVal + item.usVal)) * 100}%`,
              }"></div>
              <div class="h-full bg-sky-500 rounded-r-full flex-1"></div>
            </div>
          </div>
        </div>
      </div-->

      <div class="bg-[#161e2e] border border-[#2d3748] rounded p-2.5 min-h-55 flex flex-col">
        <div class="flex items-center justify-between border-b border-[#2d3748] pb-1.5 mb-2">
          <div class="text-[14px] font-bold text-amber-500 flex items-center gap-1">
            <span>⚠️</span> 潜在异常分析
          </div>
          <span class="text-[12px] text-slate-500">5分钟前更新</span>
        </div>

        <div class="flex gap-2 mb-2 select-none">
          <button @click="showAllWarnings"
            class="px-2 py-0.5 rounded text-[12px] transition-colors flex items-center justify-center border bg-[#2d3748] text-white border-[#2d3748] cursor-pointer">
            <span class="text-[12px] inline-block whitespace-nowrap font-semibold">
              查看完整列表
            </span>
          </button>

          <!--button @click="joinAnalysis"
            class="px-2 py-0.5 rounded text-[12px] transition-colors flex items-center justify-center border bg-[#2d3748] text-white border-[#2d3748] cursor-pointer">
            <span class="text-[12px] inline-block whitespace-nowrap font-semibold">
              加入征候研判
            </span>
          </button-->
        </div>
        <div class="flex-1 overflow-y-auto space-y-2 pr-1 text-[12px]">
          <div v-for="marker in homeStore.warningMarkers" :key="marker.id"
            class="bg-[#1a2333]/50 border-l-2 p-2 rounded-r"
            :class="marker.score && marker.score > 85 ? 'border-rose-500' : 'border-amber-500'">
            <div class="flex justify-between items-center mb-1">
              <span :class="marker.score && marker.score > 85 ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'">
                异常程度: {{ marker.score || 80 }}%
              </span>
              <span class="text-amber-400 bg-amber-500/10 px-1 rounded scale-95">
                置信度: {{ marker.confidence || 85 }}%
              </span>
            </div>
            <div class="text-slate-200 font-medium mb-1 truncate" :title="marker.name">
              {{ (marker.name || '').trim() }}
            </div>
          </div>
          <div v-if="homeStore.warningMarkers.length === 0" class="text-slate-500 text-center py-6">
            暂无异常警告数据
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-[#2d3748] bg-[#161e2e] flex flex-col transition-all duration-300"
      :style="{ height: isChatExpanded ? '420px' : '96px' }">
      <div
        class="p-2.5 flex items-center justify-between border-b border-[#2d3748]/40 cursor-pointer hover:bg-[#1a2538] transition-colors"
        @click="isChatExpanded = !isChatExpanded">
        <div class="text-[12px] font-bold text-slate-200 tracking-wide flex items-center gap-2">
          <span>云脑指挥交互终端</span>
        </div>
        <span class="text-slate-500 text-[12px] transform transition-transform duration-200"
          :class="isChatExpanded ? 'rotate-180' : ''">
          ▲
        </span>
      </div>

      <div v-if="isChatExpanded" class="flex-1 overflow-y-auto p-4 space-y-4 bg-[#111625]/40">
        <div v-if="osintAgentStatus !== 'ready'" class="text-[11px] text-center py-2 rounded border border-[#2d3748]/50 bg-[#1a2333]/50">
          <span v-if="osintAgentStatus === 'loading'" class="text-slate-400">正在连接开源情报分析师...</span>
          <span v-else-if="osintAgentStatus === 'not-found'" class="text-amber-400/90">未找到“开源情报分析师”Agent，请先在智能体中心创建。</span>
          <span v-else-if="osintAgentStatus === 'error'" class="text-rose-400/90">连接失败：{{ osintAgentError }}</span>
        </div>

        <div v-if="messages.length === 0" class="space-y-5">
          <div class="flex flex-col items-center text-center py-2">
            <div
              class="w-14 h-14 rounded-full bg-[#1b2436] border border-[#2d3748]/60 flex items-center justify-center mb-3 text-slate-500">
              <svg class="w-7 h-7 text-slate-400 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div
              class="bg-[#1a2333]/80 border border-[#2d3748]/60 p-2.5 rounded text-[12px] text-slate-400 leading-relaxed max-w-xs mx-auto">
              通过自然语言及多模态信息输入，调度多领域专家Agent，可以进行网阅、分析、研判、指令的协同指挥终端
            </div>
          </div>

          <div class="space-y-1.5 px-2">
            <div v-for="prompt in recommendedPrompts" :key="prompt" @click="selectPrompt(prompt)"
              class="bg-[#1a2333] hover:bg-[#222e44] border border-[#2d3748]/70 px-3 py-2 rounded text-[12px] text-slate-300 cursor-pointer transition-colors flex items-center gap-2">
              <span class="text-amber-500">•</span> {{ prompt }}
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
              'text-[12px] text-slate-500 mb-1 font-mono',
              msg.sender === 'user' ? 'text-right' : 'text-left',
            ]">
              {{ msg.sender === "user" ? "您" : "开源情报分析师" }} ({{
                msg.timestamp
              }})
            </div>
            <div :class="[
              'p-2.5 rounded text-[12px] leading-relaxed border',
              msg.sender === 'user'
                ? 'bg-amber-600/10 border-amber-500/30 text-amber-200 rounded-tr-none'
                : 'bg-[#1a2333] border-[#2d3748] text-slate-200 rounded-tl-none',
            ]">
              <div v-if="msg.sender === 'user'" style="white-space: pre-wrap">{{ msg.content }}</div>
              <div v-else class="markdown-body" v-html="renderMarkdown(msg.content || (msg.pending ? '思考中…' : ''))"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-2.5 bg-[#161e2e] mt-auto">
        <div
          class="relative flex items-center bg-[#0c121f] border border-[#2d3748] rounded px-3 py-1.5 focus-within:border-amber-500/60 transition-colors">
          <input v-model="chatInput" type="text" :disabled="isStreaming || osintAgentStatus !== 'ready'"
            :placeholder="isStreaming ? '开源情报分析师思考中…' : '请输入您想了解的问题'"
            class="w-full bg-transparent text-[12px] text-slate-200 placeholder-slate-600 focus:outline-none pr-16 disabled:opacity-60"
            @keyup.enter="handleSend" @focus="isChatExpanded = true" />
          <div class="absolute right-2 flex items-center gap-2">
            <button class="text-slate-500 hover:text-slate-300 transition-colors p-0.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
            <button @click="handleSend" class="w-5 h-5 rounded-full flex items-center justify-center transition-colors"
              :class="chatInput.trim() && !isStreaming && osintAgentStatus === 'ready'
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                ">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="briefingDialogVisible"
      plain
      width="960px"
      append-to-body
      :close-on-click-modal="false"
      title="简报详情"
    >
      <BriefingDialog
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
import { useHomeStore } from "@/store/modules/homeStore";
import { ElMessage } from "element-plus";
import BriefingDialog from "@/components/Dialogs/BriefingDialog.vue";
import { useBriefing } from "@/composables/useBriefing";
import { listAgents, stream, currentSession, turns } from "@/agents-hub/api";
import type { ChatEvent } from "@/agents-hub/types";

// Markdown 渲染器：禁用原始 HTML（防 XSS），自动链接，单换行转 <br>
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });
const renderMarkdown = (src: string) => md.render(src || "");

const homeStore = useHomeStore();
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

const isChatExpanded = ref(true);
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

const showAllWarnings = () => {
  homeStore.warningMarkers?.forEach(marker => {
    // 这里强制将异常的类型修改为warning2
    marker.type = "warning2";
  });

  // 切换到「异常列表」视图：原地替换左右面板为 WarningLeftPanel / WarningRightPanel
  homeStore.setWarningView(true);
};

const joinAnalysis = () => {
  ElMessage.success('已加入征候研判')
  homeStore.warningMarkers?.forEach(marker => {
    // 这里强制将异常的类型修改为warning2
    marker.type = "warning2";
  });

};
</script>

<style scoped>
.overview-body {
  max-height: 120px;
  overflow-y: auto;
}

/* 开源情报分析师回复的 Markdown 暗色主题样式 */
.markdown-body {
  font-size: 12px;
  line-height: 1.75;
  color: #e2e8f0;
  word-break: break-word;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-weight: 700;
  margin: 8px 0 4px;
  color: #fbbf24;
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
.markdown-body :deep(strong) { color: #fcd34d; font-weight: 700; }
.markdown-body :deep(em) { color: #cbd5e1; }
.markdown-body :deep(a) { color: #38bdf8; text-decoration: underline; }
.markdown-body :deep(code) {
  background: #0c121f;
  border: 1px solid #2d3748;
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #fca5a5;
}
.markdown-body :deep(pre) {
  background: #0c121f;
  border: 1px solid #2d3748;
  border-radius: 4px;
  padding: 8px 10px;
  overflow-x: auto;
  margin: 6px 0;
}
.markdown-body :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
  color: #e2e8f0;
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
  border: 1px solid #2d3748;
  padding: 3px 7px;
  text-align: left;
}
.markdown-body :deep(th) { background: #1a2333; color: #fbbf24; font-weight: 700; }
.markdown-body :deep(blockquote) {
  border-left: 3px solid #f59e0b;
  padding-left: 8px;
  color: #cbd5e1;
  margin: 6px 0;
}
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #2d3748;
  margin: 8px 0;
}
.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 4px;
  margin: 4px 0;
}
</style>
