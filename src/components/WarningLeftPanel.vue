<template>
  <div
    class="w-90 bg-[#111625]/90 border border-slate-800/80 rounded p-3 flex flex-col h-full min-h-0 shadow-xl select-none">
    <h2 class="text-base font-bold text-slate-100 mb-3 shrink-0 flex items-center gap-2">
      📊 异常列表
    </h2>

    <div class="bg-[#161c2e] p-2 rounded border border-slate-800 text-[11px] space-y-2 mb-3 shrink-0">
      <div class="flex items-start gap-2">
        <span class="text-slate-400 w-14 shrink-0 h-5 flex items-center">区域</span>
        <div class="flex gap-1 flex-wrap flex-1">
          <span v-for="opt in regionOptions" :key="opt" @click="activeRegion = opt" :class="[
            'px-1.5 py-0.5 rounded-sm cursor-pointer scale-90 origin-left transition-colors border',
            activeRegion === opt
              ? 'bg-amber-600/20 text-amber-400 border-amber-500/50'
              : 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700',
          ]">
            {{ opt }}
          </span>
          <span class="text-slate-500 cursor-pointer scale-90">···</span>
        </div>
      </div>

      <div class="flex items-start gap-2">
        <span class="text-slate-400 w-14 shrink-0 h-5 flex items-center">时间</span>
        <div class="flex gap-1 flex-wrap flex-1">
          <span v-for="opt in timeOptions" :key="opt" @click="activeTime = opt" :class="[
            'px-1.5 py-0.5 rounded-sm cursor-pointer scale-90 origin-left transition-colors border',
            activeTime === opt
              ? 'bg-amber-600/20 text-amber-400 border-amber-500/50'
              : 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700',
          ]">
            {{ opt }}
          </span>
          <span class="text-blue-400 cursor-pointer scale-90 hover:underline">自定义</span>
        </div>
      </div>

      <div class="flex items-start gap-2">
        <span class="text-slate-400 w-14 shrink-0 h-5 flex items-center">异常类型</span>
        <div class="flex gap-1 flex-wrap flex-1">
          <span v-for="opt in typeOptions" :key="opt" @click="activeType = opt" :class="[
            'px-1.5 py-0.5 rounded-sm cursor-pointer scale-90 origin-left transition-colors border',
            activeType === opt
              ? 'bg-amber-600/20 text-amber-400 border-amber-500/50'
              : 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700',
          ]">
            {{ opt }}
          </span>
        </div>
      </div>

      <div class="flex items-start gap-2">
        <span class="text-slate-400 w-14 shrink-0 h-5 flex items-center">异常对象</span>
        <div class="flex gap-1 flex-wrap flex-1">
          <span v-for="opt in targetOptions" :key="opt" @click="activeTarget = opt" :class="[
            'px-1.5 py-0.5 rounded-sm cursor-pointer scale-90 origin-left transition-colors border',
            activeTarget === opt
              ? 'bg-amber-600/20 text-amber-400 border-amber-500/50'
              : 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700',
          ]">
            {{ opt }}
          </span>
        </div>
      </div>

      <div class="space-y-1 pt-1 border-t border-slate-800/60">
        <div class="flex items-center gap-2">
          <span class="text-slate-400 w-14 shrink-0">威胁度</span>
          <div class="flex-1 flex items-center gap-2">
            <el-slider v-model="sliderThreat" :min="0" :max="100" size="small" class="custom-slider-amber flex-1" />
            <span
              class="text-amber-500 font-mono w-8 text-right bg-slate-900/60 px-1 rounded border border-slate-800">{{
                sliderThreat }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 mt-1">
          <span class="text-slate-400 w-14 shrink-0">威胁置信</span>
          <div class="flex-1 flex items-center gap-2">
            <el-slider v-model="sliderConfidence" :min="0" :max="100" size="small"
              class="custom-slider-emerald flex-1" />
            <span
              class="text-emerald-400 font-mono w-8 text-right bg-slate-900/60 px-1 rounded border border-slate-800">{{
                sliderConfidence }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1.5">
          <span class="text-slate-400 w-14 shrink-0">深度分析</span>
          <div class="flex gap-1 flex-1">
            <span v-for="opt in analysisOptions" :key="opt" @click="activeAnalysis = opt" :class="[
              'px-1.5 py-0.5 rounded-sm cursor-pointer scale-90 origin-left transition-colors border',
              activeAnalysis === opt
                ? 'bg-amber-600/20 text-amber-400 border-amber-500/50'
                : 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700',
            ]">
              {{ opt }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <span class="text-slate-400 w-14 shrink-0">排序方式</span>
          <div class="flex-1 custom-select-container">
            <el-select v-model="sortBy" placeholder="请选择" size="small" effect="dark" class="w-full">
              <el-option label="威胁度降序" value="threat-desc" />
              <el-option label="威胁度升序" value="threat-asc" />
              <el-option label="时间降序" value="time-desc" />
            </el-select>
          </div>
        </div>
      </div>
    </div>

    <button
      class="w-full py-1.5 bg-[#1d3557] hover:bg-blue-600 text-blue-300 text-xs rounded border border-blue-500/30 font-medium mb-3 shrink-0"
      @click="addAllToDeepAnalysis">
      加入云脑深度分析
    </button>

    <div class="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
      <div v-for="(item, idx) in leftListData" :key="idx" @click="toggleExpand(idx)" :class="[
        'p-2 bg-[#151a29] border rounded transition-all cursor-pointer relative',
        expandedIndex === idx
          ? 'border-amber-500/60 shadow-lg bg-[#1a2032]'
          : 'border-slate-800 hover:border-slate-700',
      ]">
        <div :class="[
          'absolute left-0 top-0 bottom-0 w-1 rounded-l',
          item.level === 'high' ? 'bg-amber-500' : 'bg-blue-500',
        ]"></div>

        <div class="pl-1.5">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-slate-200 flex items-center gap-1">
              <span :class="item.level === 'high' ? 'text-amber-500' : 'text-blue-400'
                ">
                {{
                  expandedIndex === idx && item.level === "high" ? "⚡" : "◆"
                }}
              </span>
              {{ item.title }}
            </span>
            <span v-if="item.count && expandedIndex !== idx"
              class="text-[10px] bg-amber-600/20 text-amber-500 px-1 rounded">
              {{ item.count }}
            </span>
          </div>

          <div :class="[
            'grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-400 p-1 rounded',
            expandedIndex === idx
              ? 'bg-slate-900/60 my-2 border border-slate-800'
              : '',
          ]">
            <div>
              综合威胁度
              <span class="text-amber-500 font-mono font-bold">{{
                item.threat
              }}</span>
              <span class="text-slate-500">(置信度{{ item.threatConf }})</span>
            </div>
            <div>
              综合异常度
              <span class="text-blue-400 font-mono font-bold">{{
                item.anomaly
              }}</span>
              <span class="text-slate-500">(置信度{{ item.anomalyConf }})</span>
            </div>
          </div>

          <div v-if="expandedIndex === idx" class="space-y-2 mt-2 pt-1 border-t border-slate-800/50 text-[11px]">
            <div class="space-y-1 text-slate-400">
              <div class="flex items-center">
                <span class="w-16 shrink-0 text-slate-500">异常类型</span>
                <span class="text-slate-200">{{ item.type }}</span>
              </div>
              <div class="flex items-center">
                <span class="w-16 shrink-0 text-slate-500">区域</span>
                <span class="text-slate-200">{{ item.region }}</span>
              </div>
              <div class="flex items-center">
                <span class="w-16 shrink-0 text-slate-500">包含事件</span>
                <div class="flex items-center gap-1.5">
                  <span class="text-slate-200">{{ item.count || "1个" }}</span>
                  <span class="text-amber-500 text-[10px] cursor-pointer hover:underline"
                    @click.stop="handleViewEvent(item)">
                    查看详情
                  </span>
                </div>
              </div>
            </div>

            <div class="text-[10px] text-slate-400 font-mono pt-0.5">
              {{ item.discoverTime }} 发现 | 已持续{{ item.duration }}
            </div>

            <div class="flex gap-2 pt-1">
              <button @click.stop="handleViewDetails(item)"
                class="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded border border-slate-700 transition-colors">
                查看详情
              </button>
              <button @click.stop="toggleAnalysisStatus(item)" :class="[
                'flex-1 py-1 text-[11px] rounded border transition-colors',
                item.isAnalyzed
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
              ]">
                {{ item.isAnalyzed ? "已加入深度分析" : "加入深度分析" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHomeStore } from "@/store/modules/homeStore";
import type { WarningItem } from "@/types/home";
import { ref, computed } from "vue";
const homestore = useHomeStore();

// 筛选排选项数据源
const regionOptions = ["全部", "霍尔木兹", "阿曼湾", "红海"];
const timeOptions = ["全部", "6小时内", "12小时内", "24小时内"];
const typeOptions = ["全部", "侦察", "部署", "电子战", "通信", "调动", "舆论"];
const targetOptions = ["全部", "设施", "装备", "部队", "社会"];
const analysisOptions = ["全部", "已加入", "未加入"];

// 选中的激活状态
const activeRegion = ref("全部");
const activeTime = ref("12小时内");
const activeType = ref("全部");
const activeTarget = ref("全部");
const activeAnalysis = ref("全部");

// 滑块与排序
const sliderThreat = ref(80);
const sliderConfidence = ref(80);
const sortBy = ref("threat-desc");

// 展开索引追踪
const expandedIndex = ref<number | null>(null);

const toggleExpand = (idx: number) => {
  expandedIndex.value = expandedIndex.value === idx ? null : idx;
};

// 按钮点击处理函数（加了 stop 阻止外层卡片收起）
const handleViewEvent = (item: any) => {
  console.log("查看包含事件详情:", item.title);
};

const handleViewDetails = (item: any) => {
  console.log("查看整体详情:", item.title);
};

const toggleAnalysisStatus = (item: WarningItem) => {
  homestore.addToAnalysis(item);
};
// 将所有满足筛选条件的警告加入深度分析
const addAllToDeepAnalysis = () => {
  leftListData.value.forEach((item) => {
    homestore.addToAnalysis(item);
  });
}

const leftListData = computed(() => {
  return homestore.warningMarkers.map((item): WarningItem => {
    return {
      id: item.id,
      itemId: item.itemId,
      title: item.name || "未知警告",
      count: item.count || 0,
      level: "low",
      threat: "75",
      threatConf: "82",
      anomaly: "94",
      anomalyConf: "91",
      type: item.type,
      region: "埃塞湾沿岸",
      discoverTime: "2025-04-23 05:00:00",
      duration: "9小时",
      isAnalyzed: item.isAnalyzed,
    };
  });
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

/* 橙色滑块自定义 */
:deep(.custom-slider-amber .el-slider__bar) {
  background-color: #f97316;
}

:deep(.custom-slider-amber .el-slider__button) {
  border-color: #fff;
  background-color: #f97316;
  width: 12px;
  height: 12px;
}

/* 绿色滑块自定义 */
:deep(.custom-slider-emerald .el-slider__bar) {
  background-color: #22c55e;
}

:deep(.custom-slider-emerald .el-slider__button) {
  border-color: #fff;
  background-color: #22c55e;
  width: 12px;
  height: 12px;
}

/* 公共滑块轨道样式修改 */
:deep(.el-slider__runway) {
  background-color: #1e293b;
  height: 6px !important;
  border-radius: 3px;
}

:deep(.el-slider__bar) {
  height: 6px !important;
  border-radius: 3px;
}

:deep(.el-slider__button-wrapper) {
  top: -13px;
}

/* 暗色系下拉框样式定制（兼容 Element Plus） */
.custom-select-container :deep(.el-select__wrapper) {
  background-color: #111625 !important;
  box-shadow: 0 0 0 1px #334155 inset !important;
}

.custom-select-container :deep(.el-select__placeholder) {
  color: #94a3b8 !important;
}

.custom-select-container :deep(.el-select__selected-item) {
  color: #e2e8f0 !important;
  font-size: 11px;
}
</style>
