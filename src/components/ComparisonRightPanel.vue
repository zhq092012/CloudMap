<template>
  <div
    class="w-[450px] h-full bg-[#0d121a]/95 text-gray-200 border-l border-[#1c2435] flex flex-col p-3 font-sans text-xs selection:bg-sky-500 select-none"
  >
    <div
      class="text-sm font-semibold text-white tracking-wide mb-3 border-b border-slate-800/60 pb-2 flex items-center justify-between"
    >
      <span>方案对比核验</span>
    </div>

    <div class="flex gap-2 mb-3.5">
      <button
        class="flex-1 py-1.5 bg-[#1d4ed8] border border-blue-500/50 hover:bg-blue-600 text-white rounded font-medium tracking-wider shadow transition-all"
      >
        保存核验结果
      </button>
      <button
        class="px-2.5 bg-[#1c2435] border border-slate-700 hover:bg-slate-700 text-gray-300 rounded flex items-center justify-center"
      >
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto space-y-3.5 pr-0.5 custom-scrollbar">
      <div class="bg-[#131924] border border-[#1c2435] rounded p-2.5">
        <div class="text-[11px] font-medium text-gray-400 mb-2">
          能力维度综合评分
        </div>
        <div
          class="flex justify-between items-center text-[10px] text-gray-400 font-mono mb-1"
        >
          <span
            >红方 · R1 <span class="text-[#f43f5e] font-bold">74</span></span
          >
          <span class="font-sans">综合评分</span>
          <span
            >蓝方 · P1 <span class="text-[#38bdf8] font-bold">76</span></span
          >
        </div>
        <div
          class="w-full h-2 rounded-sm overflow-hidden flex mb-4 bg-slate-800 shadow-inner"
        >
          <div class="bg-[#f43f5e]" style="width: 49%"></div>
          <div class="bg-[#38bdf8]" style="width: 51%"></div>
        </div>

        <div class="w-full flex items-center justify-center py-2 relative">
          <svg class="w-[240px] h-[150px]" viewBox="0 0 240 150">
            <polygon
              points="120,10 185,45 185,115 120,150 55,115 55,45"
              fill="none"
              stroke="#222f42"
              stroke-width="1"
            />
            <polygon
              points="120,30 165,55 165,105 120,130 75,105 75,55"
              fill="none"
              stroke="#222f42"
              stroke-dasharray="2,2"
            />
            <polygon
              points="120,50 145,65 145,95 120,110 95,95 95,65"
              fill="none"
              stroke="#222f42"
              stroke-width="1"
            />
            <line
              x1="120"
              y1="80"
              x2="120"
              y2="10"
              stroke="#1f293d"
              stroke-width="1"
            />
            <line
              x1="120"
              y1="80"
              x2="185"
              y2="45"
              stroke="#1f293d"
              stroke-width="1"
            />
            <line
              x1="120"
              y1="80"
              x2="185"
              y2="115"
              stroke="#1f293d"
              stroke-width="1"
            />
            <line
              x1="120"
              y1="80"
              x2="120"
              y2="150"
              stroke="#1f293d"
              stroke-width="1"
            />
            <line
              x1="120"
              y1="80"
              x2="55"
              y2="115"
              stroke="#1f293d"
              stroke-width="1"
            />
            <line
              x1="120"
              y1="80"
              x2="55"
              y2="45"
              stroke="#1f293d"
              stroke-width="1"
            />

            <polygon
              points="120,25 170,52 155,100 120,120 70,100 80,55"
              fill="#f43f5e"
              fill-opacity="0.2"
              stroke="#f43f5e"
              stroke-width="1.5"
            />
            <polygon
              points="120,35 155,62 175,110 120,135 60,95 65,50"
              fill="#38bdf8"
              fill-opacity="0.15"
              stroke="#38bdf8"
              stroke-width="1.5"
            />

            <g
              fill="#94a3b8"
              font-size="9"
              text-anchor="middle"
              font-family="sans-serif"
            >
              <text x="120" y="8">指挥控制</text>
              <text x="210" y="48">后勤保障</text>
              <text x="210" y="122">情报侦察</text>
              <text x="120" y="159">海上封锁</text>
              <text x="30" y="122">防空反导</text>
              <text x="30" y="48">火力打击</text>
            </g>
          </svg>
        </div>
      </div>

      <div class="bg-[#131924] border border-[#1c2435] rounded p-2.5">
        <div class="text-[11px] font-medium text-gray-400 mb-2">
          方案阶段对齐与冲突检测
        </div>

        <div class="space-y-2 font-mono text-[10px]">
          <div class="flex items-center gap-2">
            <span class="w-12 text-gray-400 shrink-0 font-sans">红方阶段</span>
            <div class="flex-1 grid grid-cols-4 gap-1">
              <div
                class="bg-[#f43f5e]/20 border border-[#f43f5e]/40 p-1 rounded text-[9px] text-[#fca5a5]"
              >
                <div class="font-bold truncate">阶段0 防御准备</div>
                <span class="opacity-60 text-[8px]">D-72h至D-2h</span>
              </div>
              <div
                class="bg-[#f43f5e]/20 border border-[#f43f5e]/40 p-1 rounded text-[9px] text-[#fca5a5]"
              >
                <div class="font-bold truncate">阶段1 抗击准备</div>
                <span class="opacity-60 text-[8px]">D-24h至D-2h</span>
              </div>
              <div
                class="bg-[#1e293b] text-gray-500 p-1 rounded text-[9px] flex items-center justify-center"
              >
                ...
              </div>
              <div
                class="bg-[#1e293b] text-gray-500 p-1 rounded text-[9px] flex items-center justify-center"
              >
                ...
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="w-12 text-gray-400 shrink-0 font-sans">蓝方阶段</span>
            <div class="flex-1 grid grid-cols-4 gap-1">
              <div
                class="bg-[#38bdf8]/20 border border-[#38bdf8]/40 p-1 rounded text-[9px] text-[#bae6fd]"
              >
                <div class="font-bold truncate">阶段0 准备期</div>
                <span class="opacity-60 text-[8px]">D-72h至D-24h</span>
              </div>
              <div
                class="bg-[#38bdf8]/20 border border-[#38bdf8]/40 p-1 rounded text-[9px] text-[#bae6fd]"
              >
                <div class="font-bold truncate">阶段1 电子压制</div>
                <span class="opacity-60 text-[8px]">D日约0200-0230</span>
              </div>
              <div
                class="bg-[#1e293b] text-gray-500 p-1 rounded text-[9px] flex items-center justify-center"
              >
                ...
              </div>
              <div
                class="bg-[#1e293b] text-gray-500 p-1 rounded text-[9px] flex items-center justify-center"
              >
                ...
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-[#241415] border border-[#ba3c3c] rounded p-2.5">
        <div
          class="flex items-center gap-1.5 text-[#f87171] font-bold text-[11px] mb-1"
        >
          <span>⚠️ 时空冲突检测 1项</span>
        </div>
        <div class="text-[11px] text-gray-300 leading-relaxed font-sans">
          红方第5架无人机队发射时间（D日0245）与Su-35S编队起飞航线轨迹交叉（D日0230-0240）轨迹交突。<br />
          <span class="text-gray-400">位置：波斯湾沿海两用基地上空<br /></span>
          <span class="text-[#fca5a5] font-medium"
            >建议：无人机发射时间向后延时15分钟，或调整发射阵位至保障基地西侧。</span
          >
        </div>
      </div>

      <div class="bg-[#241c14] border border-[#d97706] rounded p-2.5">
        <div
          class="flex items-center gap-1.5 text-[#fbbf24] font-bold text-[11px] mb-1"
        >
          <span>⚠️ 判据逻辑校验 1项</span>
        </div>
        <div class="text-[11px] text-gray-300 leading-relaxed font-sans">
          R1判据“拦截F-35I#1次”依赖被动传感器引导S-300直射。<br />
          当前Tor-M1随配制位置距离预设阻截线8km，传感器覆盖范围无法有效支撑盲射引导。<br />
          <span class="text-[#fde047] font-medium"
            >建议：Tor-M1前置至前沿防线前5km处，或增加01部队机动式被动传感器。</span
          >
        </div>
      </div>

      <div class="bg-[#131924] border border-[#1c2435] rounded p-2.5">
        <div class="text-[11px] font-medium text-gray-400 mb-2.5">
          节点重要性分析
        </div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-mono">
          <div class="flex justify-between border-b border-slate-800 pb-1">
            <span class="text-gray-400 font-sans">总站点数</span>
            <span class="text-white"
              >87 <span class="text-gray-500">/</span>
              <span class="text-gray-400">52</span></span
            >
          </div>
          <div class="flex justify-between border-b border-slate-800 pb-1">
            <span class="text-gray-400 font-sans">编组总数</span>
            <span class="text-white"
              >5 <span class="text-gray-500">/</span>
              <span class="text-gray-400">9</span></span
            >
          </div>
          <div class="flex justify-between border-b border-slate-800 pb-1">
            <span class="text-gray-400 font-sans">网络密度</span>
            <span class="text-white text-[#ef4444]"
              >0.62 <span class="text-gray-500">/</span>
              <span class="text-[#38bdf8]">0.78</span></span
            >
          </div>
          <div class="flex justify-between border-b border-slate-800 pb-1">
            <span class="text-gray-400 font-sans">平均路径长度</span>
            <span class="text-white"
              >2.1 <span class="text-gray-500">/</span>
              <span class="text-gray-400">1.4</span></span
            >
          </div>
          <div class="flex justify-between border-b border-slate-800 pb-1">
            <span class="text-gray-400 font-sans">中心度</span>
            <span class="text-white"
              >0.58 <span class="text-gray-500">/</span>
              <span class="text-gray-400">0.75</span></span
            >
          </div>
          <div class="flex justify-between border-b border-slate-800 pb-1">
            <span class="text-gray-400 font-sans">聚类系数</span>
            <span class="text-white text-[#ef4444]"
              >0.45 <span class="text-gray-500">/</span>
              <span class="text-[#38bdf8]">0.62</span></span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 高自愈静态展现，按需接入业务 Props
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
