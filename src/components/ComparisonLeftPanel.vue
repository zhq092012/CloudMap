<template>
  <div
    class="w-95 h-full bg-[#0d121a]/95 text-gray-200 border-r border-[#1c2435] flex flex-col p-3 font-sans text-xs selection:bg-sky-500 select-none">


    <div class="h-px bg-slate-800/60 my-2 shrink-0"></div>

    <h2 class="text-base font-bold text-slate-100 mb-3 shrink-0 flex items-center gap-2">
      🎨 图层面板
    </h2>

    <div class="flex-1 overflow-y-auto space-y-2.5 pr-0.5 custom-scrollbar">
      <div class="bg-[#131924] border border-[#222c3d] rounded p-2.5">
        <div class="text-[11px] font-medium text-gray-400 mb-2">主视图选择</div>

        <div class="bg-[#1b2332] border border-[#059669]/60 rounded p-2 mb-2 flex items-center justify-between">
          <span class="text-white font-medium">红蓝态势热力图</span>
          <div
            class="w-4 h-4 rounded-full bg-[#10b981]/20 border border-[#10b981] flex items-center justify-center text-[#10b981]">
            <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div class="pl-1 space-y-2.5 text-gray-300">
          <div class="flex items-center gap-1.5 text-[11px]">
            <span class="text-gray-500">热力形式:</span>
            <label class="flex items-center gap-1 cursor-pointer text-[#10b981] font-medium">
              <span class="w-2 h-2 rounded-full bg-[#10b981]"></span>蜂窝网格
            </label>
            <label class="flex items-center gap-1 cursor-pointer text-gray-400 hover:text-white">
              <span class="w-1.5 h-1.5 rounded-full border border-gray-600"></span>平滑热力
            </label>
            <label class="flex items-center gap-1 cursor-pointer text-gray-400 hover:text-white">
              <span class="w-1.5 h-1.5 rounded-full border border-gray-600"></span>点密度
            </label>
          </div>
          <div class="space-y-1.5 border-t border-slate-800/60 pt-2 text-[11px]">
            <label class="flex items-center gap-2 cursor-pointer text-gray-200">
              <input type="checkbox" checked class="accent-[#10b981]" />
              显示势力等值线
            </label>
            <label class="flex items-center gap-2 cursor-pointer text-gray-200">
              <input type="checkbox" checked class="accent-[#10b981]" />
              显示关键节点标记
            </label>
            <label class="flex items-center gap-2 cursor-pointer text-gray-200">
              <input type="checkbox" checked class="accent-[#10b981]" />
              显示基地图标
            </label>
          </div>
        </div>
      </div>

      <div v-for="title in ['波次流向图', '攻防对抗图', '动向通道关联图']" :key="title"
        class="bg-[#131924] border border-[#1c2435] rounded p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#18202e] transition-colors">
        <span class="text-gray-300 font-medium">{{ title }}</span>
        <input type="checkbox" class="accent-blue-500" />
      </div>

      <div class="bg-[#131924] border border-[#222c3d] rounded p-2.5">
        <div class="text-[11px] font-medium text-gray-400 mb-2">
          全局图例控制
        </div>

        <div class="grid grid-cols-2 gap-1 bg-[#0a0e14] p-0.5 rounded border border-slate-800 mb-2.5">
          <button
            class="py-1 text-center font-medium rounded bg-[#1e293b] text-sky-400 border border-slate-700/60 scale-95">
            关系阵营
          </button>
          <button class="py-1 text-center font-medium text-gray-500 hover:text-gray-300">
            国别划分
          </button>
        </div>

        <div class="space-y-2">
          <div v-for="camp in campList" :key="camp.name"
            class="flex items-center justify-between py-0.5 border-b border-slate-800/30">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: camp.color }"></span>
              <span class="text-gray-200">{{ camp.name }}</span>
            </div>
            <input type="checkbox" checked class="accent-[#10b981] w-3.5 h-3.5 cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

const campList = [
  { name: "我方", color: "#ef4444" },
  { name: "敌方", color: "#3b82f6" },
  { name: "友方", color: "#10b981" },
  { name: "中立方", color: "#eab308" },
  { name: "未知身份", color: "#a855f7" },
  { name: "已失效", color: "#6b7280" },
];
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 2px;
}
</style>
