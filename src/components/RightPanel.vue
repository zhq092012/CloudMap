<template>
  <div
    class="w-95 h-full bg-[#111625]/90 border-l border-[#1e293b] text-slate-200 flex flex-col font-sans select-none backdrop-blur-sm overflow-hidden">
    <div class="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
      <div class="border-b border-[#2d3748] pb-2">
        <h2 class="text-sm font-bold tracking-wider text-amber-500 flex items-center gap-1.5">
          🧠 云脑智能面板
        </h2>
      </div>

      <div class="bg-[#161e2e] border border-[#2d3748] rounded p-3 flex flex-col gap-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-amber-500 font-semibold">云脑智能态势分析</span>
          <span class="text-slate-500 scale-90">7-12小时前</span>
        </div>



        <div
          class="bg-[#111625] border border-[#2d3748]/50 p-2 rounded text-xs text-slate-300 leading-relaxed max-h-30 overflow-y-auto custom-scrollbar">
          <div class="text-amber-400/90 font-semibold mb-1 text-[11px]">
            态势分析报告 #2026-0421-001
          </div>
          <p class="text-slate-400 text-[11px]">
            过去72小时，伊以方向紧张局势持续攀升。伊朗纳坦兹核设施周边空袭雷达辐射时间增加40%，革命卫队第31防空旅进入阵地。以色列空军战备巡逻频次提升25%。美海军“艾森豪威尔”号航母编队已进入红海北部。综合评估，双方发生低烈度摩擦的概率升至62%（较上周+15%）...
          </p>
        </div>
        <button
          class="w-full py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm transition-colors mt-1 font-medium"
          @click="handleAgentDeduce">
          查看详细推演
        </button>
      </div>

      <div class="bg-[#161e2e] border border-[#2d3748] rounded p-3">
        <div class="text-xs text-slate-300 font-semibold mb-3 flex items-center justify-between">
          <span>能力画像对比研判</span>
          <span class="text-[11px] text-slate-400 font-normal">综合力量天平：<span class="text-sky-400 font-mono">美以联军
              89%</span>
            VS <span class="text-rose-400 font-mono">伊朗 72%</span></span>
        </div>

        <div class="space-y-3">
          <div v-for="item in capabilityData" :key="item.name" class="text-[11px]">
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

        <div class="grid grid-cols-3 gap-2 mt-4 w-full select-none">
          <button v-for="btn in buttons" :key="btn.id" @click="handleBtnClick(btn)"
            class="w-full py-1.5 rounded border transition-colors flex items-center justify-center">
            <span class="text-xs scale-75 inline-block whitespace-nowrap">
              {{ btn.text }}
            </span>
          </button>
        </div>
      </div>

      <div class="bg-[#161e2e] border border-[#2d3748] rounded p-3 min-h-55 flex flex-col">
        <div class="flex items-center justify-between border-b border-[#2d3748] pb-1.5 mb-2">
          <div class="text-xs font-semibold text-amber-500 flex items-center gap-1">
            <span>⚠️</span> 潜在异常分析
          </div>
          <span class="text-[10px] text-slate-500 font-mono">20分钟前更新</span>
        </div>

        <div class="flex gap-2 mb-2 select-none">
          <button @click="showAllWarnings"
            class="px-2 py-0.5 rounded text-[10px] transition-colors flex items-center justify-center border bg-[#2d3748] text-white border-[#2d3748] cursor-pointer">
            <span class="text-xs scale-75 inline-block whitespace-nowrap font-semibold">
              查看完整列表
            </span>
          </button>

          <button @click="joinAnalysis"
            class="px-2 py-0.5 rounded text-[10px] transition-colors flex items-center justify-center border bg-[#2d3748] text-white border-[#2d3748] cursor-pointer">
            <span class="text-xs scale-75 inline-block whitespace-nowrap font-semibold">
              加入征候研判
            </span>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-[11px]">
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
            <!-- <p class="text-slate-400 text-[10px] leading-normal line-clamp-2" :title="marker.description">
              {{ marker.description || '暂无详细描述信息' }}
            </p> -->
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
        class="p-3 flex items-center justify-between border-b border-[#2d3748]/40 cursor-pointer hover:bg-[#1a2538] transition-colors"
        @click="isChatExpanded = !isChatExpanded">
        <div class="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-2">
          <span>云脑指挥交互终端</span>
        </div>
        <span class="text-slate-500 text-[10px] transform transition-transform duration-200"
          :class="isChatExpanded ? 'rotate-180' : ''">
          ▲
        </span>
      </div>

      <div v-if="isChatExpanded" class="flex-1 overflow-y-auto p-4 space-y-4 bg-[#111625]/40 custom-scrollbar">
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
              class="bg-[#1a2333]/80 border border-[#2d3748]/60 p-3 rounded text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
              通过自然语言及多模态信息输入，调度多领域专家Agent，可以进行网阅、分析、研判、指令的协同指挥终端
            </div>
          </div>

          <div class="space-y-1.5 px-2">
            <div v-for="prompt in recommendedPrompts" :key="prompt" @click="selectPrompt(prompt)"
              class="bg-[#1a2333] hover:bg-[#222e44] border border-[#2d3748]/70 px-3 py-2 rounded text-[11px] text-slate-300 cursor-pointer transition-colors flex items-center gap-2">
              <span class="text-amber-500 text-xs">•</span> {{ prompt }}
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
              'text-[9px] text-slate-500 mb-1 font-mono',
              msg.sender === 'user' ? 'text-right' : 'text-left',
            ]">
              {{ msg.sender === "user" ? "您" : "云脑 Agent" }} ({{
                msg.timestamp
              }})
            </div>
            <div :class="[
              'p-2.5 rounded text-[11px] leading-relaxed border',
              msg.sender === 'user'
                ? 'bg-amber-600/10 border-amber-500/30 text-amber-200 rounded-tr-none'
                : 'bg-[#1a2333] border-[#2d3748] text-slate-200 rounded-tl-none',
            ]" style="white-space: pre-wrap">
              {{ msg.content }}
            </div>
          </div>
        </div>
      </div>

      <div class="p-3 bg-[#161e2e] mt-auto">
        <div
          class="relative flex items-center bg-[#0c121f] border border-[#2d3748] rounded px-3 py-1.5 focus-within:border-amber-500/60 transition-colors">
          <input v-model="chatInput" type="text" placeholder="请输入您想了解的问题"
            class="w-full bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none pr-16"
            @keyup.enter="handleSend" @focus="isChatExpanded = true" />
          <div class="absolute right-2 flex items-center gap-2">
            <button class="text-slate-500 hover:text-slate-300 transition-colors p-0.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
            <button @click="handleSend" class="w-5 h-5 rounded-full flex items-center justify-center transition-colors"
              :class="chatInput.trim()
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
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useHomeStore } from "@/store/modules/homeStore";
import { ElMessage } from "element-plus";
import { useAgentStore } from "@/store/modules/agentStore";
const router = useRouter();
const homeStore = useHomeStore();
const agentStore = useAgentStore();
const handleAgentDeduce = () => {
  agentStore.setCurrentTaskType("态势感知");
  homeStore.isDeduceModalOpen = true;
};
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
// ---- 新增：大模型多模态问答终端相关响应式状态与方法 ----
const isChatExpanded = ref(true); // 默认可以设定为展开或折叠状态
const chatInput = ref("");
const recommendedPrompts = ref([
  "对比上周的防空部署变化",
  "伊朗防空体系最大薄弱点在哪",
  "纳坦兹防空升级的可能意图是什么",
]);

interface ChatMessage {
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
}

const messages = ref<ChatMessage[]>([]);

// 选取推荐提示词
const selectPrompt = (prompt: string) => {
  chatInput.value = prompt;
  handleSend();
};

// 发送指令/问题
const handleSend = () => {
  const query = chatInput.value.trim();
  if (!query) return;

  const formatTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  };

  messages.value.push({
    sender: "user",
    content: query,
    timestamp: formatTime(),
  });

  chatInput.value = "";

  let reply = `云脑已收到您的指令：“${query}”。正在通过多Agent并发推演模块分析雷达信号特征并建模，请稍候...`;

  if (query.includes("对比上周的防空部署变化")) {
    reply = `经过云脑多维特征比对，伊朗本周防空部署较上周有以下三点显著变化：

1. 📡 **雷达网频次提高**：纳坦兹核设施周边的JY-14与JY-27雷达开机频次从上周的每天3次提升至全天候24小时值班，信号特征处于战时高频警戒状态。
2. 🚀 **阵地前移**：部署于设拉子的3个“霍达德-3”（3rd Khordad）中程防空导弹连已于本周二移动至阿巴斯港前沿阵地，明显在加强波斯湾入口处的低空防卫。
3. 🛡️ **新设盲区防御**：在霍尔木兹海峡沿岸增设了4个车载近程便携式防空阵地，旨在弥补前期盲区，反制低空渗透与无人机侦察。`;
  } else if (query.includes("伊朗防空体系最大薄弱点在哪")) {
    reply = `根据系统态势特征与推演库分析，伊朗防空体系目前存在以下关键薄弱点：

1. ⚡ **电子对抗能力不足**：中低空防空雷达（如JY-14）在面对美以强电磁干扰和有源压制时，极易丢失目标并产生虚警。
2. 🔗 **多目标协同瓶颈**：防空指挥控制网（Command & Control）存在约3-5秒的跨军种数据同步延迟，在应对波次饱和攻击和隐身目标（如F-35I）时，容易出现目标分配混乱。
3. 🏔️ **北部偏远空域覆盖盲区**：由于山脉地形阻挡，两伊边境中北段的低空盲区较大，雷达对贴地飞源导弹或低空突防战机探测距离不足。`;
  } else if (query.includes("纳坦兹防空升级的可能意图是什么")) {
    reply = `研判表明，纳坦兹近期防空系统升级与战备等级调整的意图主要有三：

1. 🛰️ **反制战略侦察**：防范外部对于该区域离心机大厅和地下加固设施的高精度合成孔径雷达（SAR）卫星和无人机抵近侦察。
2. 💥 **防范钻地弹空袭**：针对近期以军内瓦廷基地隐身战机挂载GBU-31(V)3钻地弹的构型调整，升级中高空截击网，防止核核心设施被外科手术式空袭摧毁。
3. 🔌 **防止网络/电磁战配合突袭**：升级后的指控系统增加了光纤闭环传输和本土地面无线电静默链路，意图切断外部无线网络注入式攻击，确保存活率。`;
  }

  setTimeout(() => {
    messages.value.push({
      sender: "assistant",
      content: reply,
      timestamp: formatTime(),
    });
  }, 350);
};

const showAllWarnings = () => {
  homeStore.warningMarkers?.forEach(marker => {
    // 这里强制将异常的类型修改为warning2
    marker.type = "warning2";
  });

  router.push("/warningcenter");
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
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #2d3748;
  border-radius: 2px;
}
</style>
