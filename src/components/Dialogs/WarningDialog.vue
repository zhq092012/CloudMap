<template>
  <div
    class="w-full max-w-5xl p-4 bg-[#111625] text-gray-200 font-sans border border-[#1e293b] rounded-lg select-none"
  >
    <div
      class="bg-[#1c1613] border border-[#d97706]/30 p-3 rounded mb-4 flex items-start justify-between"
    >
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <span
            class="text-amber-500 font-bold flex items-center gap-1 text-sm"
          >
            ⚠️ {{ title }}
          </span>
          <span
            class="text-xs bg-[#2e1d11] text-amber-500 px-1.5 py-0.5 rounded border border-[#d97706]/20"
          >
            异常度 <span class="font-bold text-sm text-red-400">93%</span>
          </span>
          <span
            class="text-xs bg-[#162e24] text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20"
          >
            置信度 <span class="font-bold text-sm text-emerald-400">78%</span>
          </span>
        </div>
        <p class="text-xs text-gray-400 leading-relaxed">
          美以联军P-8A反潜巡逻机与“全球鹰”无人侦察机在霍尔木兹海峡及阿曼湾的侦察频次由每周12架次飙升至每日8架次，且侦察航线明显向伊朗领海基线抵近。美以联军可能正在执行针对伊朗沿海防空与指挥体系的战前目标标定。建议海峡沿岸防空系统提升至一级战备。
        </p>
        <div
          class="mt-2 text-[#38bdf8] text-xs cursor-pointer hover:underline flex items-center gap-1"
        >
          云脑综合研判引擎 <span class="text-[10px]">展开详细推理过程 ﹀</span>
        </div>
      </div>

      <div class="flex gap-2 ml-4 shrink-0 text-xs">
        <button
          class="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-gray-600 rounded text-gray-300"
        >
          加入征候研判
        </button>
        <button
          class="px-3 py-1.5 bg-[#1d3557] hover:bg-[#457b9d] border border-blue-500/50 rounded text-blue-400"
        >
          在地图上聚焦
        </button>
        <button
          class="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-gray-600 rounded text-gray-300"
        >
          生成PDF报告
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div class="md:col-span-5 flex flex-col gap-4">
        <div class="bg-[#191912] border border-[#854d0e]/30 rounded p-4 flex-1">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-bold text-amber-500">行为异常评估分析</h3>
            <span class="text-[10px] text-amber-600/80">基线分析引擎</span>
          </div>

          <div class="text-xs space-y-1 text-gray-400 mb-3">
            <div>
              行为指标：<span class="text-gray-200"
                >美以联军霍尔木兹海峡侦察架次（日）</span
              >
            </div>
            <div class="flex gap-4">
              <div>
                偏离幅度：<span class="text-amber-500 font-bold">90%</span>
                <span class="text-gray-500">侦察频次较基线提升约367%</span>
              </div>
            </div>
            <div>
              偏离速率：<span class="text-amber-500 font-bold">85%</span>
              <span class="text-gray-500"
                >2月15日起10日内从基线快速攀升至峰值</span
              >
            </div>
          </div>

          <div ref="chartRef" class="w-full h-40"></div>

          <div
            class="mt-2 grid grid-cols-3 gap-2 text-[11px] text-gray-400 border-t border-gray-800 pt-2"
          >
            <div>
              当前值：<span class="text-cyan-400 font-mono">15架次/日</span>
              <span class="text-gray-500">(02.26)</span>
            </div>
            <div>
              基线值：<span class="text-amber-500 font-mono">3架次/日</span>
              <span class="text-gray-500">(近30日平均)</span>
            </div>
            <div>
              正常范围：<span class="text-gray-200 font-mono">1-5架次/日</span>
            </div>
          </div>

          <div class="flex gap-2 mt-3">
            <el-button
              size="small"
              dark
              class="bg-[#2d2d1e]! border-[#854d0e]/30! text-amber-500! text-[11px]"
              >基线分析引擎详情</el-button
            >
            <el-button
              size="small"
              dark
              class="bg-[#2d2d1e]! border-[#854d0e]/30! text-amber-500! text-[11px]"
              >基线值调整</el-button
            >
          </div>
        </div>

        <div class="bg-[#1c1221] border border-[#6b21a8]/30 rounded p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-purple-400">历史模式匹配</h3>
            <span class="text-[10px] text-purple-500/80">历史知识分析引擎</span>
          </div>
          <div class="text-xs text-gray-400 mb-2">事件特征向量</div>
          <div class="flex flex-wrap gap-1.5">
            <span
              class="px-2 py-1 bg-[#3b0764] text-purple-300 text-[11px] rounded border border-purple-500/30"
              >高侦察频次</span
            >
            <span
              class="px-2 py-1 bg-[#3b0764] text-purple-300 text-[11px] rounded border border-purple-500/30"
              >抵近领海基线</span
            >
            <span
              class="px-2 py-1 bg-[#3b0764] text-purple-300 text-[11px] rounded border border-purple-500/30"
              >多平台协同</span
            >
            <span
              class="px-2 py-1 bg-[#3b0764] text-purple-300 text-[11px] rounded border border-purple-500/30"
              >电子信号采集</span
            >
            <span
              class="px-2 py-1 bg-[#3b0764] text-purple-300 text-[11px] rounded border border-purple-500/30"
              >声呐浮标布设</span
            >
          </div>
        </div>
      </div>

      <div
        class="md:col-span-7 bg-[#0f172a]/60 border border-slate-800 rounded p-4 flex flex-col justify-between"
      >
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-slate-200">事件详情</h3>
            <span class="text-xs text-gray-500 font-mono"
              >2026年2月15日至25日</span
            >
          </div>

          <p class="text-xs text-gray-400 leading-relaxed mb-4 whitespace-pre-line">
            {{ description }}
          </p>

          <el-button
            type="primary"
            size="small"
            class="bg-[#1d4ed8]! border-none! mb-4 text-xs!"
            >播放演变动画</el-button
          >

          <div
            class="space-y-4 pl-2 relative border-l border-slate-700 ml-2 text-xs"
          >
            <div
              v-for="(item, index) in timelineData"
              :key="index"
              class="relative group"
            >
              <div
                class="absolute -left-3.25 top-0.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-[#111625]"
              ></div>

              <div class="flex items-start gap-4">
                <div class="w-16 shrink-0">
                  <div class="text-blue-400 font-bold">{{ item.date }}</div>
                  <div
                    class="text-[10px] text-gray-500 cursor-pointer hover:text-blue-300 underline decoration-dotted"
                  >
                    跳转到此时刻
                  </div>
                </div>
                <div class="text-gray-300 flex-1 leading-normal">
                  {{ item.content }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import * as echarts from "echarts";
defineProps<{
  title?: string;
  description?: string;
}>();
// 时间线模拟数据
const timelineData = [
  { date: "2月15日", content: "侦察频次开始攀升 P-8A换装低频声呐浮标" },
  { date: "2月18日", content: "“全球鹰”首次覆盖全泊位" },
  { date: "2月22日", content: "双机同时抵近7海里侦察船布设主动声呐阵列" },
  { date: "2月24日", content: "P-8A侵入伊朗领空12秒触发伊方防空响应后脱离" },
  { date: "2月26日", content: "侦察频次达到峰值日均P-8A出动8架次" },
  { date: "2月27日", content: "侦察频次维持高位" },
];

// 图表 DOM 引用
const chartRef = ref<HTMLDivElement | null>(null);
let myChart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null; // 1️⃣ 定义一个监听器
onMounted(() => {
  // 2️⃣ 确保在 DOM 彻底渲染完后再初始化
  nextTick(() => {
    if (!chartRef.value) return;

    myChart = echarts.init(chartRef.value);

    const option: echarts.EChartsOption = {
      grid: {
        top: 15,
        bottom: 20,
        left: 10,
        right: 10,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: ["2/11", "2/12", "2/13", "2/14", "2/15", "2/16", "2/17"],
        boundaryGap: false,
        axisLine: { lineStyle: { color: "#334155" } },
        axisLabel: { color: "#94a3b8", fontSize: 10 },
      },
      yAxis: {
        type: "value",
        max: 20,
        splitLine: { lineStyle: { color: "#1e293b" } },
        axisLabel: { color: "#94a3b8", fontSize: 10 },
      },
      // 🔍 请严格核对这里的 series 数组，确保只有这两项且结构完整
      series: [
        {
          name: "实际值",
          type: "line", // 确保有 type
          data: [3, 7, 6, 2, 6, 9, 15],
          smooth: true,
          showSymbol: false,
          lineStyle: { color: "#38bdf8", width: 2 },
          // markArea 必须在某个具体的 series 里面，不能独立作为数组的一项
          markArea: {
            silent: true,
            data: [
              [
                { yAxis: 1, itemStyle: { color: "rgba(234, 179, 8, 0.08)" } },
                { yAxis: 8 },
              ],
            ],
          },
        },
        {
          name: "基线值",
          type: "line", // 确保有 type
          data: [3, 3, 3, 3, 3, 3, 3],
          symbol: "none",
          lineStyle: { color: "#eab308", width: 1.5 },
        },
      ],
    };

    myChart.setOption(option);

    // 3️⃣ 核心：创建 ResizeObserver 监听父容器大小变化
    resizeObserver = new ResizeObserver(() => {
      if (myChart) {
        myChart.resize(); // 只要 div 宽度一变，立马让 echarts 跟着重绘
      }
    });

    // 开始监听
    resizeObserver.observe(chartRef.value);
  });
});

// 4️⃣ 别忘了在组件销毁时释放内存
onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  myChart?.dispose();
});
</script>

<style scoped>
/* 针对 Element Plus 按钮的微调以完全贴合暗色军工风 */
:deep(.el-button) {
  font-weight: normal;
}
</style>
