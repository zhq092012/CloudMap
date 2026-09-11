<template>
  <div
    class="w-90 h-[calc(100%-24px)] absolute left-3 top-3 z-1000 bg-[#000000]/60 border border-[#1e293b] rounded-sm text-slate-200 flex flex-col p-2.5 font-sans select-none backdrop-blur-sm"
  >
    <div
      class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-slate-400"
    >
      <button
        @click="homeStore.activeTab = '作战要素'"
        class="flex items-center gap-1.5 cursor-pointer pb-3 -mb-px transition-colors duration-200 text-sm"
        :class="
          homeStore.activeTab === '作战要素'
            ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
            : 'hover:text-slate-100 border-b-2 border-transparent'
        "
      >
        <span class="text-sm">🕸️</span>
        <span class="tracking-wider text-sm">作战要素</span>
      </button>

      <button
        @click="homeStore.activeTab = '开源情报'"
        class="flex items-center gap-1.5 cursor-pointer pb-3 -mb-px transition-colors duration-200 text-sm"
        :class="
          homeStore.activeTab === '开源情报'
            ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
            : 'hover:text-slate-100 border-b-2 border-transparent'
        "
      >
        <span class="text-sm">🧬</span>
        <span class="tracking-wider text-sm">开源情报</span>
      </button>

      <button
        @click="homeStore.activeTab = '态势图谱'"
        class="flex items-center gap-1.5 cursor-pointer pb-3 -mb-px transition-colors duration-200 text-sm"
        :class="
          homeStore.activeTab === '态势图谱'
            ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
            : 'hover:text-slate-100 border-b-2 border-transparent'
        "
      >
        <span class="text-sm">🗺️</span>
        <span class="tracking-wider text-sm">态势图谱</span>
      </button>
    </div>

    <div class="grid grid-cols-2 gap-2 mb-4">
      <div
        v-for="item in stats"
        :key="item.label"
        class="bg-[#1a2333] border border-[#2d3748] p-2 rounded flex flex-col items-center justify-center cursor-pointer"
        @click="activeStats = item"
      >
        <span
          class="text-xl font-bold font-mono tracking-wider"
          :class="item.color"
          >{{ item.value }}</span
        >
        <span class="text-xs text-slate-400 mt-1">{{ item.label }}</span>
      </div>
    </div>

    <div class="bg-[#161e2e] border border-[#2d3748] p-3 rounded mb-4 text-xs">
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="border-r border-[#2d3748]">
          <div class="text-rose-500 font-bold text-sm">
            {{ activeStats.counter.red }}
          </div>
          <div class="text-slate-400 scale-90 origin-center mt-1">红方节点</div>
        </div>
        <div class="border-r border-[#2d3748]">
          <div class="text-sky-400 font-bold text-sm">
            {{ activeStats.counter.blue }}
          </div>
          <div class="text-slate-400 scale-90 origin-center mt-1">蓝方节点</div>
        </div>
        <div>
          <div class="text-slate-300 font-bold text-sm">
            {{ activeStats.counter.other }}
          </div>
          <div class="text-slate-400 scale-90 origin-center mt-1">其余节点</div>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
      <div
        v-for="filter in activeStats.nodes"
        :key="filter.name"
        class="flex items-center justify-between bg-[#1a2333]/60 hover:bg-[#1a2333] border border-[#2d3748]/50 rounded px-3 py-2 transition-all"
      >
        <span class="text-xs tracking-wide text-slate-300">{{
          filter.name
        }}</span>
        <div class="flex items-center gap-3">
          <span
            class="text-xs font-mono text-slate-400 bg-[#111625] px-2 py-0.5 rounded border border-[#2d3748]/30"
            >{{ filter.count }}</span
          >
          <el-switch
            v-model="filter.enabled"
            size="small"
            style="
              --el-switch-on-color: #f59e0b;
              --el-switch-off-color: #2d3748;
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useHomeStore, type TabType } from "@/store/modules/homeStore";
const homeStore = useHomeStore();

interface NodeType {
  label: string;
  value: string;
  color: string;
  counter: { red: number; blue: number; other: number };
  nodes: { name: string; count: number; enabled: boolean }[];
}

watch(
  () => homeStore.activeTab,
  (newVal: TabType) => {
    if (newVal && newVal === "态势图谱") {
      // 切换到战场图谱时的逻辑处理，例如加载图谱数据等
      homeStore.generateGraphDataUseMarkers();
    } else {
      // 切换到其他标签时的逻辑处理，例如清除图谱数据等
      homeStore.clearGraphData();
    }
  },
);

const stats = ref<NodeType[]>([
  {
    label: "设施节点",
    value: "565",
    color: "text-sky-400",
    counter: { red: 153, blue: 145, other: 253 },
    nodes: [
      { name: "军事基地", count: 212, enabled: true },
      { name: "军用机场", count: 78, enabled: true },
      { name: "民用机场", count: 104, enabled: true },
      { name: "海军设施、港口", count: 109, enabled: true },
      { name: "雷达站", count: 45, enabled: true },
      { name: "管道设施", count: 6, enabled: true },
      { name: "水坝设施", count: 8, enabled: true },
      { name: "Other", count: 2, enabled: true },
    ],
  },
  {
    label: "装备节点",
    value: "1040",
    color: "text-indigo-400",
    counter: { red: 347, blue: 645, other: 253 },
    nodes: [
      { name: "天基装备", count: 212, enabled: true },
      { name: "空基装备", count: 104, enabled: true },
      { name: "地基装备", count: 78, enabled: true },
      { name: "海基装备", count: 109, enabled: true },
      { name: "网基装备", count: 45, enabled: true },
    ],
  },
  {
    label: "部队节点",
    value: "658",
    color: "text-purple-400",
    counter: { red: 225, blue: 145, other: 253 },
    nodes: [
      { name: "陆军部队", count: 212, enabled: true },
      { name: "海军部队", count: 78, enabled: true },
      { name: "空军部队", count: 104, enabled: true },
      { name: "战略导弹/火箭部队", count: 109, enabled: true },
      { name: "特种作战部队", count: 45, enabled: true },
      { name: "边海防/守备部队", count: 45, enabled: true },
      { name: "预备役/民兵力量", count: 45, enabled: true },
      { name: "军事指挥/保障机构", count: 45, enabled: true },
    ],
  },
  {
    label: "社会节点",
    value: "364",
    color: "text-amber-500",
    counter: { red: 229, blue: 100, other: 293 },
    nodes: [
      { name: "重点人物", count: 212, enabled: true },
      { name: "宗教节点", count: 78, enabled: true },
      { name: "民族分布", count: 104, enabled: true },
      { name: "经济节点", count: 109, enabled: true },
      { name: "政治节点", count: 45, enabled: true },
      { name: "特殊天气", count: 45, enabled: true },
    ],
  },
]);

const activeStats = ref<NodeType>(stats.value[0]);
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
